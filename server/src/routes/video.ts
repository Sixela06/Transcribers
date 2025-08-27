import express from 'express';
import { VideoController } from '../controllers/videoController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { validateYouTubeUrl } from '../middleware/validation';

const router = express.Router();

// Transcribe is free for all users (no auth required, but optional for tracking)
router.post('/transcribe', optionalAuth, validateYouTubeUrl, VideoController.transcribe);

// Summarize requires authentication and AI rate limiting
router.post('/summarize', authenticate, validateYouTubeUrl, aiLimiter, VideoController.summarize);

// Video management routes (all require authentication)
router.get('/my-videos', authenticate, VideoController.getUserVideos);
router.get('/:id', authenticate, VideoController.getVideo);
router.delete('/:id', authenticate, VideoController.deleteVideo);

export default router;