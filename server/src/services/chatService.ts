import { PrismaClient } from '@prisma/client';
import { AIService } from './aiService';

const prisma = new PrismaClient();

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  videoId: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export class ChatService {
  // New memory-based chat method - no database dependency
  static async sendMessageWithTranscript(
    transcript: string,
    message: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<ChatMessage> {
    try {
      // Clean transcript content if it has embedded segments
      let cleanTranscript = transcript;
      
      if (transcript.includes('\n')) {
        const lines = transcript.split('\n');
        if (lines[0].startsWith('[{') && lines[0].includes('"start":')) {
          // Extract text content after segments
          cleanTranscript = lines.slice(1).join('\n').trim();
          
          // If no text content after segments, extract from segments
          if (!cleanTranscript) {
            try {
              const segments = JSON.parse(lines[0]);
              cleanTranscript = segments.map((s: any) => s.text).join(' ');
            } catch (e) {
              cleanTranscript = transcript;
            }
          }
        }
      }

      // Generate AI response using the AIService (which has smart truncation)
      const aiResponseContent = await AIService.chatWithTranscript(
        cleanTranscript,
        message,
        chatHistory
      );

      // Return AI response in expected format
      return {
        id: Date.now().toString(),
        content: aiResponseContent,
        role: 'assistant',
        createdAt: new Date(),
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Chat service error:', error);
      throw new Error(`Failed to process chat message: ${error.message}`);
    }
  }

  // Legacy database-based method - kept for backward compatibility
  static async sendMessage(
    userId: string,
    videoId: string, // This is youtubeId from URL
    message: string
  ): Promise<ChatMessage> {
    // Look up video by youtubeId
    const video = await prisma.video.findFirst({
      where: {
        youtubeId: videoId,
        userId,
      },
      include: {
        transcript: true,
      },
    });

    if (!video) {
      throw new Error('Video not found or access denied');
    }

    if (!video.transcript) {
      throw new Error('Video transcript not available for chat');
    }

    // Find or create chat session using the database video.id
    let session = await prisma.chatSession.findFirst({
      where: {
        userId,
        videoId: video.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      const title = message.length > 50 
        ? message.substring(0, 50) + '...' 
        : message;

      session = await prisma.chatSession.create({
        data: {
          userId,
          videoId: video.id,
          title,
        },
        include: {
          messages: true,
        },
      });
    }

    // Create user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        content: message,
        role: 'USER',
      },
    });

    // Prepare chat history for AI
    const chatHistory = session.messages.map((msg: any) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }));

    // Extract clean transcript content
    let transcriptContent = video.transcript.content;
    
    // Handle embedded segments format
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

    // Generate AI response
    const aiResponseContent = await AIService.chatWithTranscript(
      transcriptContent,
      message,
      chatHistory
    );

    // Create AI message
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        content: aiResponseContent,
        role: 'ASSISTANT',
      },
    });

    return this.formatChatMessage(aiMessage);
  }

  static async getChatHistory(
    userId: string,
    videoId: string
  ): Promise<ChatSession | null> {
    const video = await prisma.video.findFirst({
      where: {
        youtubeId: videoId,
        userId,
      },
    });

    if (!video) {
      return null;
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        userId,
        videoId: video.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return null;
    }

    return this.formatChatSession(session);
  }

  static async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        video: {
          select: {
            title: true,
            youtubeId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return sessions.map((session: any) => this.formatChatSession(session));
  }

  static async deleteChatSession(
    userId: string,
    sessionId: string
  ): Promise<void> {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  private static formatChatSession(session: any): ChatSession {
    return {
      id: session.id,
      title: session.title,
      videoId: session.videoId,
      messages: session.messages.map((msg: any) => this.formatChatMessage(msg)),
      createdAt: session.createdAt,
    };
  }

  private static formatChatMessage(message: any): ChatMessage {
    return {
      id: message.id,
      content: message.content,
      role: message.role.toLowerCase() as 'user' | 'assistant',
      createdAt: message.createdAt,
      timestamp: message.createdAt.toISOString(),
    };
  }
}