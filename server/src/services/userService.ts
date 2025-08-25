import { PrismaClient } from '@prisma/client';
import { UpdateProfileRequest, UserStats } from '../types/user';

const prisma = new PrismaClient();

export class UserService {
  static async updateProfile(userId: string, data: UpdateProfileRequest) {
    // Check if email is already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new Error('Email is already taken');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
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

    return {
      ...updatedUser,
      subscriptionType: updatedUser.subscriptionType.toString(),
    };
  }

  static async getUserStats(userId: string): Promise<UserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyUsage: true,
        totalVideos: true,
        subscriptionType: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get usage limits based on subscription
    const dailyLimit = user.subscriptionType === 'FREE' ? 2 : 
                      user.subscriptionType === 'BASIC' ? 20 : 100;

    // Get recent videos count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVideos = await prisma.video.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      dailyUsage: user.dailyUsage,
      dailyLimit,
      totalVideos: user.totalVideos,
      recentVideos,
      subscriptionType: user.subscriptionType.toString(),
      memberSince: user.createdAt,
    };
  }

  static async resetDailyUsage(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyUsage: 0,
        lastUsageReset: new Date(),
      },
    });
  }

  static async incrementUsage(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyUsage: { increment: 1 },
        totalVideos: { increment: 1 },
      },
    });
  }

  static async canUseService(userId: string): Promise<{ canUse: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyUsage: true,
        subscriptionType: true,
        lastUsageReset: true,
      },
    });

    if (!user) {
      return { canUse: false, reason: 'User not found' };
    }

    // Check if daily usage needs to be reset
    const now = new Date();
    const lastReset = new Date(user.lastUsageReset);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    
    let currentUsage = user.dailyUsage;
    if (daysSinceReset >= 1) {
      currentUsage = 0;
      await this.resetDailyUsage(userId);
    }

    // Check usage limits based on subscription
    const dailyLimit = user.subscriptionType === 'FREE' ? 2 : 
                      user.subscriptionType === 'BASIC' ? 20 : 100;

    if (currentUsage >= dailyLimit) {
      return { canUse: false, reason: 'Daily usage limit exceeded' };
    }

    return { canUse: true };
  }
  
}