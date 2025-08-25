import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { validateRegister, validateLogin } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { error } = validateRegister(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const profile = await AuthService.getProfile(req.userId!);
      res.json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    // With JWT, logout is handled on the frontend by removing the token
    res.json({ message: 'Logout successful' });
  }

  static async googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { credential } = req.body;
    
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Invalid Google token' });
      return;
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionType: true,
        dailyUsage: true,
        totalVideos: true,
        createdAt: true,
      },
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          password: '', // Google users don't need a password
          firstName: payload.given_name || '',
          lastName: payload.family_name || '',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscriptionType: true,
          dailyUsage: true,
          totalVideos: true,
          createdAt: true,
        },
      });
    }

    // Generate token
    const { generateToken } = require('../utils/jwt');
    const token = generateToken(user.id);

    const authResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        createdAt: user.createdAt.toISOString(),
        subscription: {
          plan: user.subscriptionType.toLowerCase() === 'premium' ? 'premium' : 'free',
          status: 'active',
          dailyLimit: user.subscriptionType === 'FREE' ? 2 : 50,
          dailyUsage: user.dailyUsage,
        },
      },
      token,
    };

    res.json(authResponse);
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(400).json({ error: 'Google authentication failed' });
  }
}
}

