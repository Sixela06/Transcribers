import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/jwt';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionType: true,
        dailyUsage: true,
        totalVideos: true,
        lastUsageReset: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Check if we need to reset daily usage
    const now = new Date();
    const lastReset = new Date(user.lastUsageReset);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReset >= 1) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          dailyUsage: 0,
          lastUsageReset: now,
        },
      });
      user.dailyUsage = 0;
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ADD this function to the existing server/src/middleware/auth.ts file:
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscriptionType: true,
          dailyUsage: true,
          totalVideos: true,
          lastUsageReset: true,
        },
      });

      if (user) {
        // Check if we need to reset daily usage
        const now = new Date();
        const lastReset = new Date(user.lastUsageReset);
        const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceReset >= 1) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              dailyUsage: 0,
              lastUsageReset: now,
            },
          });
          user.dailyUsage = 0;
        }

        req.userId = user.id;
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};