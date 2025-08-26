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

  static async getTranscript(videoId: string): Promise<{ content: string; language?: string }> {
    try {
      console.log(`\n=== PYTHON TRANSCRIPT EXTRACTION FOR: ${videoId} ===`);
      console.log(`🔗 Video URL: https://www.youtube.com/watch?v=${videoId}`);

      // Call Python script using child_process
      const pythonScript = path.join(__dirname, '../../scripts/get_transcript.py');
      console.log(`🐍 Calling Python script: ${pythonScript}`);

      const result = await this.callPythonScript(pythonScript, videoId);
      
      if (!result.success) {
        throw new Error(result.error || 'Python script execution failed');
      }

      console.log(`✅ Python script success: ${result.transcript.length} characters`);
      console.log(`📝 Language: ${result.language}`);
      console.log(`📖 Preview: "${result.transcript.substring(0, 300)}..."`);

      return {
        content: result.transcript,
        language: result.language || 'en'
      };

    } catch (error: any) {
      console.error('💥 Error in Python transcript extraction:', error);
      
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('no transcript') || errorMessage.includes('transcript not available')) {
        throw new Error('No transcript available for this video');
      } else if (errorMessage.includes('video not found')) {
        throw new Error('Video not found or unavailable');
      } else if (errorMessage.includes('transcripts disabled')) {
        throw new Error('Transcripts are disabled for this video');
      } else {
        throw new Error(`Failed to extract transcript: ${error.message}`);
      }
    }
  }

  private static callPythonScript(scriptPath: string, videoId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Spawning Python process...`);
      
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
        console.log(`🐍 Python process exited with code: ${code}`);
        
        if (code === 0) {
          try {
            // Parse JSON output from Python script
            const result = JSON.parse(stdout.trim());
            console.log('📊 Python result:', result);
            resolve(result);
          } catch (parseError) {
            console.error('❌ Failed to parse Python output:', stdout);
            reject(new Error(`Invalid JSON from Python script: ${stdout}`));
          }
        } else {
          console.error('❌ Python script error output:', stderr);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error);
        reject(new Error(`Failed to execute Python script: ${error.message}`));
      });

      // Set timeout for long-running scripts
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script execution timeout'));
      }, 30000); // 30 second timeout

      pythonProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }
}