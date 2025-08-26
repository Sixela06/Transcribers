// REPLACE the entire router setup in server/src/routes/video.ts:
import express from 'express';
import { VideoController } from '../controllers/videoController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { validateYouTubeUrl } from '../middleware/validation';

const router = express.Router();

// Transcribe is free for all users (no auth required, but optional for tracking)
router.post('/transcribe', optionalAuth, validateYouTubeUrl, VideoController.transcribe);

// All other video routes require authentication
router.use(authenticate);

// Summarize uses AI and counts against usage (apply AI rate limiting)
router.post('/summarize', aiLimiter, validateYouTubeUrl, VideoController.summarize);

// Video management routes
router.get('/my-videos', VideoController.getUserVideos);
router.get('/:id', VideoController.getVideo);
router.delete('/:id', VideoController.deleteVideo);

export default router;