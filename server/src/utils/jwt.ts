import jwt from 'jsonwebtoken';
import { config } from './config';

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};