import express from 'express';
import { VideoController } from '../controllers/videoController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { validateYouTubeUrl } from '../middleware/validation';

const router = express.Router();

// All video routes require authentication
router.use(authenticate);

// Transcribe is free for all users (no AI rate limit)
router.post('/transcribe', validateYouTubeUrl, VideoController.transcribe);

// Summarize uses AI and counts against usage (apply AI rate limiting)
router.post('/summarize', aiLimiter, validateYouTubeUrl, VideoController.summarize);

// Video management routes
router.get('/my-videos', VideoController.getUserVideos);
router.get('/:id', VideoController.getVideo);
router.delete('/:id', VideoController.deleteVideo);

export default router;