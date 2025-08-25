import express from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.get('/stats', UserController.getUserStats);
router.delete('/delete-account', UserController.deleteAccount);

export default router;