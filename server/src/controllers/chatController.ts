import { Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { validateSendMessage } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

export class ChatController {
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error } = validateSendMessage(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const { videoId } = req.params;
      const { message } = req.body;

      const result = await ChatService.sendMessage(
        req.userId!,
        videoId,
        message
      );

      res.json(result);
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;

      const result = await ChatService.getChatHistory(req.userId!, videoId);

      if (!result) {
        res.json({ messages: [] });
        return;
      }

      res.json(result);
    } catch (error: any) {
      console.error('Get chat history error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await ChatService.getUserChatSessions(req.userId!);
      res.json(result);
    } catch (error: any) {
      console.error('Get user sessions error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      await ChatService.deleteChatSession(req.userId!, sessionId);

      res.json({ message: 'Chat session deleted successfully' });
    } catch (error: any) {
      console.error('Delete session error:', error);
      res.status(404).json({ error: error.message });
    }
  }
}