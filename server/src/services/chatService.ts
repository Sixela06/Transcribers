import { PrismaClient } from '@prisma/client';
import { AIService } from './aiService';

const prisma = new PrismaClient();

export interface ChatMessage {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: Date;
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
    videoId: string,
    message: string
  ): Promise<{ session: ChatSession; newMessage: ChatMessage; aiResponse: ChatMessage }> {
    // Verify user has access to the video
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
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

    // Find or create chat session
    let session = await prisma.chatSession.findFirst({
      where: {
        userId,
        videoId,
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
          videoId,
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

    // Generate AI response
    const aiResponseContent = await AIService.chatWithTranscript(
      video.transcript.content,
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

    // Get updated session
    const updatedSession = await prisma.chatSession.findUnique({
      where: { id: session.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      session: this.formatChatSession(updatedSession!),
      newMessage: this.formatChatMessage(userMessage),
      aiResponse: this.formatChatMessage(aiMessage),
    };
  }

  static async getChatHistory(
    userId: string,
    videoId: string
  ): Promise<ChatSession | null> {
    const session = await prisma.chatSession.findFirst({
      where: {
        userId,
        videoId,
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
      role: message.role,
      createdAt: message.createdAt,
    };
  }
}