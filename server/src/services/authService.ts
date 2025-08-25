import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, name, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Handle name field - if 'name' is provided, split it into first and last name
    let userFirstName = firstName;
    let userLastName = lastName;
    
    if (name && !firstName && !lastName) {
      const nameParts = name.trim().split(' ');
      userFirstName = nameParts[0];
      userLastName = nameParts.slice(1).join(' ') || undefined;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: userFirstName,
        lastName: userLastName,
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

    return {
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

    return {
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

    return {
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
    };
  }
}