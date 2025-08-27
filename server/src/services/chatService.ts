import { PrismaClient } from '@prisma/client';
import { AIService } from './aiService';

const prisma = new PrismaClient();

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant'; // Changed to match frontend expectations
  createdAt: Date;
  timestamp?: string; // Added for frontend
}

export interface ChatSession {
  id: string;
  title?: string;
  videoId: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export class ChatService {
  static async sendMessage(
    userId: string,
    videoId: string, // This is actually the youtubeId from the URL
    message: string
  ): Promise<ChatMessage> {
    // FIXED: Look up video by youtubeId instead of database id
    const video = await prisma.video.findFirst({
      where: {
        youtubeId: videoId, // Changed from id to youtubeId
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
        videoId: video.id, // Use the database ID for session
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      // Create new session with a title based on the first message
      const title = message.length > 50 
        ? message.substring(0, 50) + '...' 
        : message;

      session = await prisma.chatSession.create({
        data: {
          userId,
          videoId: video.id, // Use database ID
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

    // Return just the AI response in the format expected by frontend
    return this.formatChatMessage(aiMessage);
  }

  static async getChatHistory(
    userId: string,
    videoId: string // This is youtubeId
  ): Promise<ChatSession | null> {
    // FIXED: Look up video by youtubeId
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
        videoId: video.id, // Use database ID
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
      role: message.role.toLowerCase() as 'user' | 'assistant', // Now matches interface
      createdAt: message.createdAt,
      timestamp: message.createdAt.toISOString(), // Add timestamp for frontend
    };
  }
}