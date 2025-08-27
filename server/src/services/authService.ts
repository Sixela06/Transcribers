import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';
import { UsageLimits, SubscriptionType } from '../utils/usageLimits';

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        subscriptionType: 'FREE',
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

    // Generate token
    const token = generateToken(user.id);

    // Use configurable limits
    const dailyLimit = UsageLimits.getDailyLimit(user.subscriptionType as SubscriptionType);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        createdAt: user.createdAt.toISOString(),
        subscription: {
          plan: user.subscriptionType.toLowerCase() === 'premium' ? 'premium' : 'free',
          status: 'active',
          dailyLimit: dailyLimit,
          dailyUsage: user.dailyUsage,
        },
      },
      token,
    };
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        subscriptionType: true,
        dailyUsage: true,
        totalVideos: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id);

    // Use configurable limits
    const dailyLimit = UsageLimits.getDailyLimit(user.subscriptionType as SubscriptionType);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        createdAt: user.createdAt.toISOString(),
        subscription: {
          plan: user.subscriptionType.toLowerCase() === 'premium' ? 'premium' : 'free',
          status: 'active',
          dailyLimit: dailyLimit,
          dailyUsage: user.dailyUsage,
        },
      },
      token,
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new Error('User not found');
    }

    // Use configurable limits
    const dailyLimit = UsageLimits.getDailyLimit(user.subscriptionType as SubscriptionType);

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      createdAt: user.createdAt.toISOString(),
      subscription: {
        plan: user.subscriptionType.toLowerCase() === 'premium' ? 'premium' : 'free',
        status: 'active',
        dailyLimit: dailyLimit,
        dailyUsage: user.dailyUsage,
      },
    };
  }
}