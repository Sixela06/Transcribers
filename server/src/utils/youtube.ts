import { google } from 'googleapis';
import { YoutubeTranscript } from 'youtube-transcript';
import { config } from './config';

const youtube = google.youtube({
  version: 'v3',
  auth: config.youtubeApiKey,
});

export class YouTubeService {
  static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  static isValidYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null;
  }

  static async getVideoMetadata(videoId: string) {
    try {
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video) {
        throw new Error('Video not found');
      }

      const snippet = video.snippet;
      const contentDetails = video.contentDetails;

      return {
        title: snippet?.title,
        description: snippet?.description,
        thumbnailUrl: snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url,
        duration: contentDetails?.duration,
        channelName: snippet?.channelTitle,
        publishedAt: snippet?.publishedAt ? new Date(snippet.publishedAt) : null,
      };
    } catch (error: any) {
      console.error('Error fetching video metadata:', error);
      throw new Error('Failed to fetch video metadata');
    }
  }

static async getTranscript(videoId: string): Promise<{ content: string; language?: string }> {
  try {
    console.log(`Attempting to fetch transcript for video: ${videoId}`);
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptArray || transcriptArray.length === 0) {
      throw new Error('No transcript data returned');
    }
    
    const content = transcriptArray
      .map(entry => entry.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!content) {
      throw new Error('No transcript content after processing');
    }

    console.log(`Successfully fetched transcript, length: ${content.length}`);
    return {
      content,
      language: 'en',
    };
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    
    if (error.message.includes('Transcript is disabled')) {
      throw new Error('Transcripts are disabled for this video');
    } else if (error.message.includes('No transcripts were found')) {
      throw new Error('No transcript available for this video');
    } else if (error.message.includes('Could not retrieve a transcript')) {
      throw new Error('Unable to retrieve transcript - video may not have captions');
    } else {
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
  }
}
}