import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { validateUpdateProfile } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

export class UserController {
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error } = validateUpdateProfile(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const result = await UserService.updateProfile(req.userId!, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await UserService.getUserStats(req.userId!);
      res.json(result);
    } catch (error: any) {
      console.error('Get user stats error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Profile data is already available from auth middleware
      res.json({
        ...req.user,
        subscriptionType: req.user.subscriptionType.toString(),
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await UserService.deleteAccount(req.userId!);
    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
}
}