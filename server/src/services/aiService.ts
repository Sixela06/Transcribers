import OpenAI from 'openai';
import { config } from '../utils/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export class AIService {
  // Token limits for different models
  private static readonly TOKEN_LIMITS = {
    'gpt-3.5-turbo': 16385,
    'gpt-4': 32768,
    'gpt-4-turbo': 128000
  };

  // Rough estimation: 1 token ≈ 0.75 words (4 characters)
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private static truncateTranscript(transcript: string, maxTokens: number): { text: string; truncated: boolean } {
    const estimatedTokens = this.estimateTokens(transcript);
    
    if (estimatedTokens <= maxTokens) {
      return { text: transcript, truncated: false };
    }

    // Strategy: Take first 40%, last 20%, and sample 40% from middle
    const words = transcript.split(' ');
    const totalWords = words.length;
    
    const firstPortion = Math.floor(totalWords * 0.4);
    const lastPortion = Math.floor(totalWords * 0.2);
    const middlePortion = Math.floor(totalWords * 0.4);
    
    const firstWords = words.slice(0, firstPortion);
    const lastWords = words.slice(-lastPortion);
    
    // Sample from middle section
    const middleStart = firstPortion;
    const middleEnd = totalWords - lastPortion;
    const middleWords = words.slice(middleStart, middleEnd);
    
    // Take every nth word from middle to get desired portion
    const stepSize = Math.max(1, Math.floor(middleWords.length / middlePortion));
    const sampledMiddle = middleWords.filter((_, index) => index % stepSize === 0).slice(0, middlePortion);
    
    const truncatedText = [
      ...firstWords,
      '\n[... middle section sampled ...]\n',
      ...sampledMiddle,
      '\n[... content continues ...]\n',
      ...lastWords
    ].join(' ');

    return { text: truncatedText, truncated: true };
  }

  private static async chunkAndSummarize(
    transcript: string,
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS' = 'STANDARD'
  ): Promise<string> {
    console.log('📝 Using chunking strategy for very long transcript...');
    
    const maxChunkTokens = 10000; // Even more conservative for chunks
    const maxChunkChars = maxChunkTokens * 4; // Rough conversion
    
    // Split into chunks
    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkChars && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    console.log(`📝 Processing ${chunks.length} chunks...`);

    // Summarize each chunk
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`📝 Processing chunk ${i + 1}/${chunks.length}...`);
      
      try {
        const chunkSummary = await this.summarizeChunk(chunks[i], i + 1, chunks.length, summaryType);
        chunkSummaries.push(chunkSummary);
      } catch (error) {
        console.error(`Error summarizing chunk ${i + 1}:`, error);
        chunkSummaries.push(`[Error processing section ${i + 1}]`);
      }
    }

    // Combine summaries into final summary
    console.log('📝 Combining chunk summaries...');
    return this.combineSummaries(chunkSummaries, summaryType);
  }

  private static async summarizeChunk(
    chunk: string,
    chunkIndex: number,
    totalChunks: number,
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS'
  ): Promise<string> {
    const prompt = `Summarize this section (part ${chunkIndex} of ${totalChunks}) of a video transcript. Focus on key points and main ideas:\n\n${chunk}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are summarizing a section of a video transcript. Be concise but capture the key information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || '[Failed to summarize section]';
  }

  private static async combineSummaries(
    summaries: string[],
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS'
  ): Promise<string> {
    const combinedText = summaries.join('\n\n');
    
    let prompt = '';
    switch (summaryType) {
      case 'DETAILED':
        prompt = `Create a detailed, comprehensive summary from these section summaries of a video. Organize the information logically and ensure it flows well:\n\n${combinedText}`;
        break;
      case 'BULLET_POINTS':
        prompt = `Create a bullet-point summary from these section summaries. Extract the most important points and organize them clearly:\n\n${combinedText}`;
        break;
      default:
        prompt = `Create a concise, well-organized summary from these section summaries of a video:\n\n${combinedText}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are creating a final summary from multiple section summaries. Make it coherent and well-structured.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: summaryType === 'DETAILED' ? 1500 : 800,
      temperature: 0.3,
    });

    const finalSummary = response.choices[0]?.message?.content?.trim();
    if (!finalSummary) {
      throw new Error('Failed to generate final summary');
    }

    return finalSummary + '\n\n[Note: This summary was generated from a long video using advanced processing techniques]';
  }

  static async summarizeTranscript(
    transcript: string,
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS' = 'STANDARD'
  ): Promise<string> {
    try {
      const estimatedTokens = this.estimateTokens(transcript);
      // Conservative limit: 85% of max tokens (15% buffer)
      const maxTokens = Math.floor(this.TOKEN_LIMITS['gpt-3.5-turbo'] * 0.85) - 1000; // ~12,900 tokens
      
      console.log(`📊 Transcript analysis: ~${estimatedTokens} tokens (conservative limit: ${maxTokens})`);

      // Strategy 1: Try direct summarization if comfortably within limits
      if (estimatedTokens <= maxTokens) {
        console.log('✅ Transcript size OK, using direct summarization');
        return this.directSummarize(transcript, summaryType);
      }
      
      // Strategy 2: Try intelligent truncation for moderately long transcripts
      else if (estimatedTokens <= maxTokens * 1.5) {
        console.log('⚠️ Transcript too long, using intelligent truncation');
        const { text: truncatedText, truncated } = this.truncateTranscript(transcript, maxTokens);
        const summary = await this.directSummarize(truncatedText, summaryType);
        
        if (truncated) {
          return summary + '\n\n[Note: Summary based on key sections of a long video]';
        }
        return summary;
      }
      
      // Strategy 3: Use chunking for very long transcripts
      else {
        console.log('🔄 Transcript very long, using chunking strategy');
        return this.chunkAndSummarize(transcript, summaryType);
      }

    } catch (error: any) {
      console.error('OpenAI Error:', error.code, error.message);
      
      if (error.code === 'context_length_exceeded') {
        console.log('⚠️  Context length exceeded, trying emergency truncation');
        try {
          const { text } = this.truncateTranscript(transcript, 6000); // Very aggressive truncation
          const summary = await this.directSummarize(text, summaryType);
          return summary + '\n\n[Note: Summary based on abbreviated version due to length constraints]';
        } catch (secondError) {
          console.error('Emergency truncation also failed:', secondError);
          throw new Error('Transcript too long to process');
        }
      }
      
      throw new Error('Failed to generate summary');
    }
  }

  private static async directSummarize(
    transcript: string,
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS'
  ): Promise<string> {
    let prompt = '';
    
    switch (summaryType) {
      case 'DETAILED':
        prompt = `Please provide a detailed summary of the following video transcript. Include key points, main arguments, examples mentioned, and important conclusions. The summary should be comprehensive but well-organized:\n\n${transcript}`;
        break;
      case 'BULLET_POINTS':
        prompt = `Please summarize the following video transcript in clear bullet points. Focus on the main ideas, key takeaways, and important information:\n\n${transcript}`;
        break;
      default:
        prompt = `Please provide a concise but informative summary of the following video transcript. Focus on the main points and key takeaways:\n\n${transcript}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates clear, informative summaries of video content. Focus on accuracy and readability.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: summaryType === 'DETAILED' ? 1500 : 800,
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) {
      throw new Error('Failed to generate summary');
    }

    return summary;
  }

  static async chatWithTranscript(
    transcript: string,
    userMessage: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      // For chat, be even more conservative - 80% of limit
      const maxTokens = Math.floor(this.TOKEN_LIMITS['gpt-3.5-turbo'] * 0.8) - 2000; // ~11,000 tokens
      const { text: processedTranscript } = this.truncateTranscript(transcript, maxTokens);

      const systemPrompt = `You are a helpful AI assistant that can answer questions about a specific video based on its transcript. Here is the transcript of the video:

${processedTranscript}

Please answer questions based on the content of this transcript. Be accurate and helpful, and reference specific parts of the video when relevant. If a question cannot be answered based on the transcript, politely explain that the information is not available in the video.`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...chatHistory,
        { role: 'user' as const, content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content?.trim();
      if (!reply) {
        throw new Error('Failed to generate response');
      }

      return reply;
    } catch (error: any) {
      console.error('OpenAI Chat Error:', error.code, error.message);
      throw new Error('Failed to generate response');
    }
  }
}