import express from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// Chat endpoints use AI and should be rate limited
router.post('/:videoId/message', aiLimiter, ChatController.sendMessage);
router.get('/:videoId/history', ChatController.getChatHistory);
router.get('/sessions', ChatController.getUserSessions);
router.delete('/sessions/:sessionId', ChatController.deleteSession);

export default router;