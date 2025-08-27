import { google } from 'googleapis';
import { spawn } from 'child_process';
import { config } from './config';
import path from 'path';

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

  static async getTranscript(videoId: string): Promise<{
    content: string;
    segments?: Array<{ text: string; start: number; duration: number }>;
    language?: string;
  }> {
    return new Promise((resolve, reject) => {
      console.log(`Fetching transcript for video ${videoId}...`);
      
      const pythonScript = path.join(__dirname, '../../scripts/get_transcript.py');
      
      // FIXED: Use 'python' instead of 'python3' to match your working manual command
      const process = spawn('python', [pythonScript, videoId]);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          reject(new Error('Failed to extract transcript'));
          return;
        }
        
        try {
          const result = JSON.parse(output);
          
          if (!result.success) {
            // Handle specific error types
            if (result.error_type === 'NO_TRANSCRIPT') {
              reject(new Error('No transcript available for this video'));
            } else if (result.error_type === 'VIDEO_NOT_FOUND') {
              reject(new Error('Video not found or is private'));
            } else if (result.error_type === 'TRANSCRIPTS_DISABLED') {
              reject(new Error('Transcripts are disabled for this video'));
            } else {
              reject(new Error(result.error || 'Failed to extract transcript'));
            }
            return;
          }
          
          // FIXED: Handle the actual Python script response format
          // The Python script returns transcript as a string, not an object
          resolve({
            content: result.transcript, // result.transcript is the actual transcript text
            segments: undefined, // Your current Python script doesn't return segments
            language: result.language_code || result.language || 'en'
          });
          
        } catch (parseError) {
          console.error('Failed to parse Python script output:', parseError);
          console.error('Raw output:', output);
          reject(new Error('Failed to parse transcript data'));
        }
      });
      
      process.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error('Failed to start transcript extraction process'));
      });
    });
  }

  private static callPythonScript(scriptPath: string, videoId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Spawning Python process...`);
      
      // FIXED: Use 'python' consistently
      const pythonProcess = spawn('python', [scriptPath, videoId], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse script output: ${parseError}`));
          }
        } else {
          console.error(`Python script exited with code ${code}`);
          console.error(`stderr: ${stderr}`);
          reject(new Error(`Python script failed: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`Failed to start Python process: ${error}`);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
}

export const createYouTubeUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

export const formatViewCount = (viewCount: string | number): string => {
  const count = typeof viewCount === 'string' ? parseInt(viewCount) : viewCount;
  
  if (count >= 1000000000) {
    return (count / 1000000000).toFixed(1) + 'B';
  } else if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  } else {
    return count.toString();
  }
};

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};