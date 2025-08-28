import { apiService } from './api';
import { ChatMessage } from '../types/video';

// Send chat message with transcript included in request
export const sendChatMessage = async (
  transcript: string,
  message: string,
  chatHistory: ChatMessage[] = []
): Promise<ChatMessage> => {
  return apiService.post<ChatMessage>('/chat/message', {
    transcript,
    message,
    chatHistory: chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  });
};

// Legacy functions kept for backward compatibility (though not used in new approach)
export const getChatHistory = async (videoId: string): Promise<{ messages: ChatMessage[] }> => {
  // Return empty since we're using in-memory chat now
  return { messages: [] };
};

export const createChatSession = async (videoId: string): Promise<{ messages: ChatMessage[] }> => {
  // Return empty since we're using in-memory chat now
  return { messages: [] };
};