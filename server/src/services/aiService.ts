import OpenAI from 'openai';
import { config } from '../utils/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export class AIService {
  static async summarizeTranscript(
    transcript: string,
    summaryType: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS' = 'STANDARD'
  ): Promise<string> {
    try {
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
    } catch (error: any) {
      console.error('Error generating summary:', error);
      if (error.code === 'insufficient_quota') {
        throw new Error('AI service quota exceeded. Please try again later.');
      }
      throw new Error('Failed to generate summary');
    }
  }

  static async chatWithTranscript(
    transcript: string,
    userMessage: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      const systemPrompt = `You are a helpful AI assistant that can answer questions about a specific video based on its transcript. Here is the transcript of the video:

${transcript}

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
      console.error('Error in chat:', error);
      if (error.code === 'insufficient_quota') {
        throw new Error('AI service quota exceeded. Please try again later.');
      }
      throw new Error('Failed to generate response');
    }
  }
}