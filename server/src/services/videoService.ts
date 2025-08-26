import { PrismaClient } from '@prisma/client';
import { YouTubeService } from '../utils/youtube';
import { AIService } from './aiService';
import { VideoData } from '../types/video';

const prisma = new PrismaClient();

export class VideoService {
  // REPLACE the transcribeVideo method signature and implementation:
static async transcribeVideo(userId: string | null, url: string): Promise<VideoData> {
  const videoId = YouTubeService.extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  let video;
  try {
    // Check if video already exists
    video = await prisma.video.findUnique({
      where: { youtubeId: videoId },
      include: {
        transcript: true,
        summaries: true,
      },
    });

    // If video doesn't exist, create it
    if (!video) {
      const metadata = await YouTubeService.getVideoMetadata(videoId);
      
      video = await prisma.video.create({
        data: {
          youtubeId: videoId,
          ...(userId && { userId }), // Only include userId if it exists
          title: metadata.title,
          description: metadata.description,
          thumbnailUrl: metadata.thumbnailUrl,
          duration: metadata.duration,
          channelName: metadata.channelName,
          publishedAt: metadata.publishedAt,
          status: 'PROCESSING',
        },
        include: {
          transcript: true,
          summaries: true,
        },
      });
    }

    // If transcript doesn't exist, fetch it
    if (!video.transcript) {
      const transcriptData = await YouTubeService.getTranscript(videoId);
      
      await prisma.transcript.create({
        data: {
          videoId: video.id,
          content: transcriptData.content,
          language: transcriptData.language,
        },
      });

      // Update video status
      await prisma.video.update({
        where: { id: video.id },
        data: { status: 'COMPLETED' },
      });

      // Refresh video data
      video = await prisma.video.findUnique({
        where: { id: video.id },
        include: {
          transcript: true,
          summaries: true,
        },
      })!;
    }

    return this.formatVideoData(video);
  } catch (error: any) {
    // Update video status to failed if it was created
    if (video) {
      await prisma.video.update({
        where: { id: video.id },
        data: { status: 'FAILED' },
      });
    }
    throw error;
  }
}

  static async summarizeVideo(
    userId: string, 
    url: string, 
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS' = 'STANDARD'
  ): Promise<VideoData> {
    // Check user's daily usage limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check usage limits based on subscription
    const dailyLimit = user.subscriptionType === 'FREE' ? 2 : 
                      user.subscriptionType === 'BASIC' ? 20 : 100;

    if (user.dailyUsage >= dailyLimit) {
      throw new Error('Daily usage limit exceeded. Please upgrade your plan.');
    }

    // First get the transcript
    const videoData = await this.transcribeVideo(userId, url);
    
    if (!videoData.transcript) {
      throw new Error('Failed to get transcript');
    }

    // Check if summary already exists
    const video = await prisma.video.findUnique({
      where: { youtubeId: videoData.youtubeId },
      include: {
        summaries: {
          where: { type: summaryType },
        },
      },
    });

    let summary;
    if (video && video.summaries.length > 0) {
      summary = video.summaries[0];
    } else {
      // Generate new summary
      const summaryContent = await AIService.summarizeTranscript(
        videoData.transcript.content,
        summaryType
      );

      summary = await prisma.summary.create({
        data: {
          videoId: videoData.id,
          content: summaryContent,
          type: summaryType,
        },
      });

      // Update user's usage
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyUsage: { increment: 1 },
          totalVideos: { increment: 1 },
        },
      });
    }

    // Get updated video data
    const updatedVideo = await prisma.video.findUnique({
      where: { id: videoData.id },
      include: {
        transcript: true,
        summaries: true,
      },
    });

    return this.formatVideoData(updatedVideo!);
  }

  static async getVideo(videoId: string, userId: string): Promise<VideoData> {
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId,
      },
      include: {
        transcript: true,
        summaries: true,
      },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    return this.formatVideoData(video);
  }

  static async getUserVideos(userId: string): Promise<VideoData[]> {
    const videos = await prisma.video.findMany({
      where: { userId },
      include: {
        transcript: true,
        summaries: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return videos.map((video: any) => this.formatVideoData(video));
  }

  static async deleteVideo(videoId: string, userId: string): Promise<void> {
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId,
      },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    await prisma.video.delete({
      where: { id: videoId },
    });
  }

  // ADD this method to VideoService class if missing:
private static formatVideoData(video: any): VideoData {
  return {
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    channelName: video.channelName,
    publishedAt: video.publishedAt,
    status: video.status,
    transcript: video.transcript ? {
      content: video.transcript.content,
      language: video.transcript.language,
    } : undefined,
    summaries: video.summaries || [],
  };
  }
}