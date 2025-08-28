import OpenAI from 'openai';
import { config } from '../utils/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

// Define supported model types
type ModelName = 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';

export class AIService {
  // Updated token limits for GPT-4o Mini with proper typing
  private static readonly TOKEN_LIMITS: Record<ModelName, number> = {
    'gpt-4o-mini': 128000,  // 8x larger than GPT-3.5 Turbo
    'gpt-3.5-turbo': 16385, // Keep for reference/fallback
    'gpt-4': 32768,
    'gpt-4-turbo': 128000
  };

  // Primary models to use with proper typing
  private static readonly MODELS = {
    SUMMARIZATION: 'gpt-4o-mini' as ModelName,
    CHAT: 'gpt-4o-mini' as ModelName
  };

  // Improved token estimation for GPT-4o Mini (same tokenizer as GPT-4o)
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 3); // More accurate estimation
  }

  private static truncateTranscript(transcript: string, maxTokens: number): { text: string; truncated: boolean } {
    const estimatedTokens = this.estimateTokens(transcript);
    
    if (estimatedTokens <= maxTokens) {
      return { text: transcript, truncated: false };
    }

    // Strategy: Take first 50%, last 25%, and sample 25% from middle
    const words = transcript.split(' ');
    const totalWords = words.length;
    
    const firstPortion = Math.floor(totalWords * 0.5);
    const lastPortion = Math.floor(totalWords * 0.25);
    const middlePortion = Math.floor(totalWords * 0.25);
    
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
    console.log('📝 Using chunking strategy for extremely long transcript...');
    
    // Much larger chunks possible with GPT-4o Mini
    const maxChunkTokens = 50000; // Can handle much larger chunks now
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
      model: this.MODELS.SUMMARIZATION,
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
      max_tokens: 800, // Can afford more tokens now
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
      model: this.MODELS.SUMMARIZATION,
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
      max_tokens: summaryType === 'DETAILED' ? 2000 : 1200, // Increased limits
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
      // More generous limit with GPT-4o Mini: 90% of max tokens (10% buffer)
      const maxTokens = Math.floor(this.TOKEN_LIMITS[this.MODELS.SUMMARIZATION] * 0.9) - 2000; // ~113,200 tokens
      
      console.log(`📊 Transcript analysis: ~${estimatedTokens} tokens (limit: ${maxTokens}) using ${this.MODELS.SUMMARIZATION}`);

      // Strategy 1: Try direct summarization - much more likely to work now
      if (estimatedTokens <= maxTokens) {
        console.log('✅ Transcript size OK, using direct summarization');
        return this.directSummarize(transcript, summaryType);
      }
      
      // Strategy 2: Try intelligent truncation for very long transcripts
      else if (estimatedTokens <= maxTokens * 2) {
        console.log('⚠️ Transcript quite long, using intelligent truncation');
        const { text: truncatedText, truncated } = this.truncateTranscript(transcript, maxTokens);
        const summary = await this.directSummarize(truncatedText, summaryType);
        
        if (truncated) {
          return summary + '\n\n[Note: Summary based on key sections of a very long video]';
        }
        return summary;
      }
      
      // Strategy 3: Use chunking for extremely long transcripts (rare now)
      else {
        console.log('🔄 Transcript extremely long, using chunking strategy');
        return this.chunkAndSummarize(transcript, summaryType);
      }

    } catch (error: any) {
      console.error('OpenAI Error:', error.code, error.message);
      
      if (error.code === 'context_length_exceeded') {
        console.log('⚠️ Context length exceeded, trying emergency truncation');
        try {
          const { text } = this.truncateTranscript(transcript, 50000); // More generous emergency limit
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
      model: this.MODELS.SUMMARIZATION,
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
      max_tokens: summaryType === 'DETAILED' ? 2000 : 1200, // Increased limits
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
      // Much more generous with GPT-4o Mini - 70% of limit (30% buffer for chat history + system prompt)
      const maxTranscriptTokens = Math.floor(this.TOKEN_LIMITS[this.MODELS.CHAT] * 0.7) - 3000; // ~86,600 tokens for transcript
      
      const estimatedTokens = this.estimateTokens(transcript);
      console.log(`💬 Chat token analysis: transcript ~${estimatedTokens} tokens (limit: ${maxTranscriptTokens}) using ${this.MODELS.CHAT}`);
      
      const { text: processedTranscript, truncated } = this.truncateTranscript(transcript, maxTranscriptTokens);

      const systemPrompt = `You are a helpful AI assistant answering questions about a video. Here is the transcript:

${processedTranscript}

Answer based on this content. Be helpful and reference specific parts when relevant.${truncated ? ' Note: Transcript shortened for processing.' : ''}`;

      // Can afford more chat history with larger context window
      const limitedHistory = chatHistory.slice(-8); // Increased from 3 to 8 messages

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...limitedHistory,
        { role: 'user' as const, content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: this.MODELS.CHAT,
        messages,
        max_tokens: 1000, // Increased response length
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content?.trim();
      if (!reply) {
        throw new Error('Failed to generate response');
      }

      return reply;
    } catch (error: any) {
      console.error('OpenAI Chat Error:', error.code, error.message);
      
      if (error.code === 'context_length_exceeded') {
        console.log('⚠️ Chat context length exceeded, trying emergency truncation');
        try {
          // Less aggressive emergency truncation with GPT-4o Mini
          const { text } = this.truncateTranscript(transcript, 20000); // Increased from 2000 to 20000
          
          const systemPrompt = `Answer questions about this video excerpt:

${text}

Note: This is an excerpt from a longer video.`;

          // Minimal chat history in emergency mode
          const recentHistory = chatHistory.slice(-2);
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...recentHistory,
            { role: 'user' as const, content: userMessage }
          ];

          const response = await openai.chat.completions.create({
            model: this.MODELS.CHAT,
            messages,
            max_tokens: 600,
            temperature: 0.7,
          });

          const reply = response.choices[0]?.message?.content?.trim();
          return reply + '\n\n[Note: Answer based on excerpt due to video length]';
        } catch (secondError) {
          console.error('Emergency chat truncation also failed:', secondError);
          return "I'm sorry, but this video is too long for me to process in chat. Please try asking about a shorter video, or use the summarization feature first to get key points.";
        }
      }
      
      throw new Error('Failed to generate response');
    }
  }
}