import { PrismaClient } from '@prisma/client';
import { YouTubeService } from '../utils/youtube';

const prisma = new PrismaClient();

export class TranscriptService {
  static async processTranscript(videoId: string): Promise<string> {
    try {
      // Check if transcript already exists in database
      const existingTranscript = await prisma.transcript.findFirst({
        where: { video: { youtubeId: videoId } },
      });

      if (existingTranscript) {
        return existingTranscript.content;
      }

      // Fetch transcript from YouTube
      const transcriptData = await YouTubeService.getTranscript(videoId);
      
      return transcriptData.content;
    } catch (error: any) {
      console.error('Error processing transcript:', error);
      throw new Error('Failed to process transcript');
    }
  }

  static async saveTranscript(videoDbId: string, content: string, language?: string) {
    try {
      const transcript = await prisma.transcript.create({
        data: {
          videoId: videoDbId,
          content,
          language,
        },
      });

      return transcript;
    } catch (error: any) {
      console.error('Error saving transcript:', error);
      throw new Error('Failed to save transcript');
    }
  }

  static formatTranscriptForDisplay(content: string): string {
    // Clean up transcript text for better readability
    return content
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*/g, '$1\n\n')
      .trim();
  }

  static extractKeywords(content: string, limit: number = 10): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  static getTranscriptStats(content: string) {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const avgWordsPerSentence = Math.round(words.length / sentences.length);
    
    // Estimate reading time (average 200 words per minute)
    const estimatedReadingTime = Math.ceil(words.length / 200);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence,
      estimatedReadingTime,
      keywords: this.extractKeywords(content),
    };
  }
}