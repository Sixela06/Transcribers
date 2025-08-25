import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Apply auth rate limiting to all routes
router.use(authLimiter);

router.post('/google', AuthController.googleAuth);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getProfile);

export default router;