import { PrismaClient } from '@prisma/client';
import { YouTubeService } from '../utils/youtube';
import { AIService } from './aiService';
import { VideoData } from '../types/video';
import { UsageLimits, SubscriptionType } from '../utils/usageLimits';

const prisma = new PrismaClient();

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface FormattedVideoResponse {
  metadata: {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    viewCount: string;
  };
  transcript: {
    segments: TranscriptSegment[];
    fullText: string;
  } | null;
  summary?: {
    id: string;
    videoId: string;
    summary: string;
    keyPoints: string[];
    createdAt: string;
  };
}

export class VideoService {
  /**
   * Format video data from database to frontend expected format
   */
  private static formatVideoResponse(video: any): FormattedVideoResponse {
    // Format metadata according to frontend expectations
    const metadata = {
      id: video.youtubeId,
      title: video.title || 'Untitled Video',
      description: video.description || '',
      duration: video.duration || '0:00',
      thumbnail: video.thumbnailUrl || '',
      channelTitle: video.channelName || 'Unknown Channel',
      publishedAt: video.publishedAt?.toISOString() || new Date().toISOString(),
      viewCount: '0' // You might want to fetch this from YouTube API
    };

    // Format transcript according to frontend expectations
    let transcript = null;
    if (video.transcript) {
      // Check if the content contains structured segment data (JSON format)
      let segments: TranscriptSegment[] = [];
      
      try {
        // Try to extract segments if they're stored within the content
        const lines = video.transcript.content.split('\n');
        const firstLine = lines[0];
        
        // Check if the first line contains JSON segment data
        if (firstLine.startsWith('[{') && firstLine.includes('"start":')) {
          const segmentsData = JSON.parse(firstLine);
          if (Array.isArray(segmentsData) && segmentsData.length > 0) {
            segments = segmentsData;
            // Remove the first line to get just the text content
            const textContent = lines.slice(1).join('\n').trim();
            video.transcript.content = textContent || segments.map(s => s.text).join(' ');
          }
        }
      } catch (e) {
        // If parsing fails, we'll generate segments from the text
      }
      
      // If no segments found, generate them from the content
      if (segments.length === 0) {
        // Convert transcript content to segments (split by sentences)
        const sentences = video.transcript.content
          .split(/[.!?]+/)
          .filter((sentence: any) => sentence.trim().length > 0)
          .map((sentence: any) => sentence.trim());

        segments = sentences.map((sentence: string, index: number) => ({
          text: sentence + (index < sentences.length - 1 ? '.' : ''),
          start: index * 5, // Fake timing: 5 seconds per sentence
          duration: 5
        }));
      }

      transcript = {
        segments: segments,
        fullText: video.transcript.content
      };
    }

    // Format summary if it exists
    let summary = null;
    if (video.summaries && video.summaries.length > 0) {
      const latestSummary = video.summaries[0];
      
      // Try to extract key points from summary content
      const keyPoints = this.extractKeyPointsFromSummary(latestSummary.content);
      
      summary = {
        id: latestSummary.id,
        videoId: video.id,
        summary: latestSummary.content,
        keyPoints: keyPoints,
        createdAt: latestSummary.createdAt?.toISOString() || new Date().toISOString()
      };
    }

    const response: any = {
      metadata,
      transcript
    };

    if (summary) {
      response.summary = summary;
    }

    return response;
  }

  /**
   * Extract key points from summary content
   */
  private static extractKeyPointsFromSummary(summaryContent: string): string[] {
    // Simple key point extraction - look for bullet points or numbered items
    const lines = summaryContent.split('\n').filter(line => line.trim().length > 0);
    const keyPoints = [];
    
    for (const line of lines) {
      // Look for bullet points or numbered lists
      if (line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/) || line.includes('Key point:')) {
        keyPoints.push(line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').replace('Key point:', '').trim());
      }
    }
    
    // If no structured points found, split by sentences and take first few
    if (keyPoints.length === 0) {
      const sentences = summaryContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
      return sentences.slice(0, 3).map(s => s.trim());
    }
    
    return keyPoints.slice(0, 5); // Limit to 5 key points
  }

  /**
   * Store transcript with optional segment data embedded in content
   */
  private static formatTranscriptContent(content: string, segments?: TranscriptSegment[]): string {
    if (segments && segments.length > 0) {
      // Store segments as JSON on the first line, followed by the text content
      return JSON.stringify(segments) + '\n' + content;
    }
    return content;
  }

  /**
   * Transcribe a YouTube video
   */
  static async transcribeVideo(userId: string | null, url: string): Promise<FormattedVideoResponse> {
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
        
        // Create a placeholder user ID if none provided
        let effectiveUserId = userId;
        if (!effectiveUserId) {
          const systemUser = await this.getSystemUser();
          effectiveUserId = systemUser.id;
        }
        
        video = await prisma.video.create({
          data: {
            youtubeId: videoId,
            userId: effectiveUserId,
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
        console.log(`Fetching transcript for video ${videoId}...`);
        const transcriptData = await YouTubeService.getTranscript(videoId);
        
        // Format the content to include segments if available
        const formattedContent = this.formatTranscriptContent(
          transcriptData.content,
          transcriptData.segments
        );
        
        await prisma.transcript.create({
          data: {
            videoId: video.id,
            content: formattedContent,
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

      console.log(`Transcript ready for video ${videoId}`);
      return this.formatVideoResponse(video);
      
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
  ): Promise<FormattedVideoResponse> {
    try {
      // Check user's daily usage limit
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Use configurable usage limits
      const dailyLimit = UsageLimits.getDailyLimit(user.subscriptionType as SubscriptionType);

      if (user.dailyUsage >= dailyLimit) {
        throw new Error(`Daily usage limit exceeded (${dailyLimit} summaries). Please upgrade your plan.`);
      }

      // Log for debugging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Usage check: ${user.dailyUsage}/${dailyLimit} (${user.subscriptionType})`);
      }

      // ... rest of the method remains the same ...
      
      // First get the transcript (pass userId since this is authenticated)
      const transcriptResult = await this.transcribeVideo(userId, url);
      
      if (!transcriptResult.transcript) {
        throw new Error('Failed to get transcript');
      }

      // Get the video ID to work with database
      const videoId = YouTubeService.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Check if summary already exists
      const video = await prisma.video.findUnique({
        where: { youtubeId: videoId },
        include: {
          transcript: true,
          summaries: {
            where: { type: summaryType },
          },
        },
      });

      if (!video || !video.transcript) {
        throw new Error('Video or transcript not found in database');
      }

      let summary;
      if (video.summaries.length > 0) {
        summary = video.summaries[0];
        console.log(`Using existing summary for video ${videoId}`);
      } else {
        console.log(`Generating new ${summaryType} summary for video ${videoId}...`);
        
        // Extract just the text content for AI processing (remove segments if they exist)
        let transcriptContent = video.transcript.content;
        
        // Check if content has segments data on first line
        const lines = transcriptContent.split('\n');
        if (lines[0].startsWith('[{') && lines[0].includes('"start":')) {
          // Skip the first line (segments) and use the rest
          transcriptContent = lines.slice(1).join('\n').trim();
          
          // If no text content after segments, extract from segments
          if (!transcriptContent) {
            try {
              const segments = JSON.parse(lines[0]);
              transcriptContent = segments.map((s: any) => s.text).join(' ');
            } catch (e) {
              transcriptContent = video.transcript.content;
            }
          }
        }
        
        // Generate new summary using the transcript content
        const summaryContent = await AIService.summarizeTranscript(
          transcriptContent,
          summaryType
        );

        summary = await prisma.summary.create({
          data: {
            videoId: video.id,
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

        console.log(`Summary generated successfully for video ${videoId}`);
      }

      // Get updated video data with the summary
      const updatedVideo = await prisma.video.findUnique({
        where: { id: video.id },
        include: {
          transcript: true,
          summaries: true,
        },
      });

      return this.formatVideoResponse(updatedVideo!);
      
    } catch (error: any) {
      console.error('VideoService.summarizeVideo error:', error);
      throw error;
    }
  }

  /**
   * Get a specific video by ID for a user
   */
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

  /**
   * Get all videos for a user
   */
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

  /**
   * Delete a video and all associated data
   */
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

      // Delete the video (cascade will handle related records)
      await prisma.video.delete({
        where: { id: videoId },
      });

      console.log(`Video ${videoId} deleted successfully`);
    } catch (error: any) {
      console.error('VideoService.deleteVideo error:', error);
      throw error;
    }
  }

  /**
   * Format video data for legacy endpoints (keeping for backward compatibility)
   */
  private static formatVideoData(video: any): VideoData {
    // Extract just text content if segments are embedded
    let transcriptContent = '';
    if (video.transcript) {
      transcriptContent = video.transcript.content;
      
      // Check if content has segments data on first line
      const lines = transcriptContent.split('\n');
      if (lines[0].startsWith('[{') && lines[0].includes('"start":')) {
        // Use the text content after segments
        transcriptContent = lines.slice(1).join('\n').trim();
        
        // If no text content after segments, extract from segments
        if (!transcriptContent) {
          try {
            const segments = JSON.parse(lines[0]);
            transcriptContent = segments.map((s: any) => s.text).join(' ');
          } catch (e) {
            transcriptContent = video.transcript.content;
          }
        }
      }
    }

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
        content: transcriptContent,
        language: video.transcript.language || 'en',
      } : undefined,
      summaries: video.summaries ? video.summaries.map((summary: any) => ({
        id: summary.id,
        content: summary.content,
        type: summary.type,
      })) : [],
    };
  }

  /**
   * Get or create system user for anonymous operations
   */
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

  /**
   * Get video statistics
   */
  static async getVideoStats(videoId: string, userId: string) {
    try {
      const video = await prisma.video.findFirst({
        where: {
          youtubeId: videoId,
          userId,
        },
        include: {
          transcript: true,
          summaries: true,
          chatSessions: {
            include: {
              messages: true,
            },
          },
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      // Extract text content for stats
      let transcriptContent = '';
      if (video.transcript) {
        transcriptContent = video.transcript.content;
        const lines = transcriptContent.split('\n');
        if (lines[0].startsWith('[{') && lines[0].includes('"start":')) {
          transcriptContent = lines.slice(1).join('\n').trim();
          if (!transcriptContent) {
            try {
              const segments = JSON.parse(lines[0]);
              transcriptContent = segments.map((s: any) => s.text).join(' ');
            } catch (e) {
              transcriptContent = video.transcript.content;
            }
          }
        }
      }

      const stats = {
        transcriptLength: transcriptContent.length || 0,
        wordCount: transcriptContent.split(' ').length || 0,
        summaryCount: video.summaries?.length || 0,
        chatSessionCount: video.chatSessions?.length || 0,
        totalChatMessages: video.chatSessions?.reduce((total: number, session: any) => 
          total + (session.messages?.length || 0), 0) || 0,
        createdAt: video.createdAt,
        lastAccessedAt: video.updatedAt,
      };

      return stats;
    } catch (error: any) {
      console.error('VideoService.getVideoStats error:', error);
      throw error;
    }
  }

  /**
   * Search user's videos
   */
  static async searchVideos(userId: string, query: string, limit: number = 10) {
    try {
      const videos = await prisma.video.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { channelName: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          transcript: true,
          summaries: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return videos.map((video: any) => this.formatVideoData(video));
    } catch (error: any) {
      console.error('VideoService.searchVideos error:', error);
      throw error;
    }
  }
}