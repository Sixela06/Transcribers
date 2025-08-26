import { PrismaClient } from '@prisma/client';
import { YouTubeService } from '../utils/youtube';
import { AIService } from './aiService';
import { VideoData } from '../types/video';

const prisma = new PrismaClient();

export class VideoService {
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
        
        // TEMPORARY FIX: Create a placeholder user ID if none provided
        // This allows transcription to work while maintaining database constraints
        let effectiveUserId = userId;
        if (!effectiveUserId) {
          // Create or find a system user for anonymous transcriptions
          let systemUser = await prisma.user.findUnique({
            where: { email: 'system@transcriber.app' }
          });

          if (!systemUser) {
            systemUser = await prisma.user.create({
              data: {
                email: 'system@transcriber.app',
                password: 'system-placeholder',
                firstName: 'System',
                lastName: 'Anonymous',
                subscriptionType: 'FREE',
              }
            });
          }
          effectiveUserId = systemUser.id;
        }
        
        video = await prisma.video.create({
          data: {
            youtubeId: videoId,
            userId: effectiveUserId, // Now always has a value
            title: metadata.title || null,
            description: metadata.description || null,
            thumbnailUrl: metadata.thumbnailUrl || null,
            duration: metadata.duration || null,
            channelName: metadata.channelName || null,
            publishedAt: metadata.publishedAt || null,
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
            language: transcriptData.language || null,
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
      console.error('VideoService.transcribeVideo error:', error);
      
      // Update video status to failed if it was created
      if (video) {
        try {
          await prisma.video.update({
            where: { id: video.id },
            data: { status: 'FAILED' },
          });
        } catch (updateError) {
          console.error('Failed to update video status:', updateError);
        }
      }
      
      // Re-throw with more specific error message
      if (error.message.includes('Transcript is disabled')) {
        throw new Error('Transcripts are disabled for this video');
      } else if (error.message.includes('No transcript available')) {
        throw new Error('No transcript available for this video');
      } else if (error.message.includes('Video not found')) {
        throw new Error('Video not found or is private');
      } else if (error.message.includes('Could not retrieve a transcript')) {
        throw new Error('Unable to retrieve transcript - video may not have captions');
      } else {
        throw new Error(`Failed to transcribe video: ${error.message}`);
      }
    }
  }

  static async summarizeVideo(
    userId: string, 
    url: string, 
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS' = 'STANDARD'
  ): Promise<VideoData> {
    try {
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

      // First get the transcript (pass userId since this is authenticated)
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
    } catch (error: any) {
      console.error('VideoService.summarizeVideo error:', error);
      throw error;
    }
  }

  static async getVideo(videoId: string, userId: string): Promise<VideoData> {
    try {
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
    } catch (error: any) {
      console.error('VideoService.getVideo error:', error);
      throw error;
    }
  }

  static async getUserVideos(userId: string): Promise<VideoData[]> {
    try {
      const videos = await prisma.video.findMany({
        where: { userId },
        include: {
          transcript: true,
          summaries: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return videos.map((video: any) => this.formatVideoData(video));
    } catch (error: any) {
      console.error('VideoService.getUserVideos error:', error);
      throw error;
    }
  }

  static async deleteVideo(videoId: string, userId: string): Promise<void> {
    try {
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
    } catch (error: any) {
      console.error('VideoService.deleteVideo error:', error);
      throw error;
    }
  }

  private static formatVideoData(video: any): VideoData {
    return {
      id: video.id,
      youtubeId: video.youtubeId,
      title: video.title || '',
      description: video.description || '',
      thumbnailUrl: video.thumbnailUrl || '',
      duration: video.duration || '',
      channelName: video.channelName || '',
      publishedAt: video.publishedAt || new Date(),
      status: video.status,
      transcript: video.transcript ? {
        content: video.transcript.content,
        language: video.transcript.language || 'en',
      } : undefined,
      summaries: video.summaries ? video.summaries.map((summary: any) => ({
        id: summary.id,
        content: summary.content,
        type: summary.type,
      })) : [],
    };
  }

  // Helper method to get or create system user
  static async getSystemUser() {
    let systemUser = await prisma.user.findUnique({
      where: { email: 'system@transcriber.app' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@transcriber.app',
          password: 'system-placeholder',
          firstName: 'System',
          lastName: 'Anonymous',
          subscriptionType: 'FREE',
        }
      });
    }

    return systemUser;
  }
}