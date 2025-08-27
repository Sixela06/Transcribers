import { apiService } from './api';
import { ChatMessage, ChatSession } from '../types/video';

export const sendChatMessage = async (
  videoId: string, 
  message: string
): Promise<ChatMessage> => {
  return apiService.post<ChatMessage>(`/chat/${videoId}/message`, { message });
};

export const getChatHistory = async (videoId: string): Promise<ChatSession> => {
  return apiService.get<ChatSession>(`/chat/${videoId}/history`);
};

export const createChatSession = async (videoId: string): Promise<ChatSession> => {
  return apiService.post<ChatSession>(`/chat/${videoId}`, {});
};