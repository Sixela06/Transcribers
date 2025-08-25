import { Request, Response, NextFunction } from 'express';
import { YouTubeService } from '../utils/youtube';

export const validateYouTubeUrl = (req: Request, res: Response, next: NextFunction): void => {
  const { url } = req.body;
  
  if (!url) {
    res.status(400).json({ error: 'YouTube URL is required' });
    return;
  }

  if (!YouTubeService.isValidYouTubeUrl(url)) {
    res.status(400).json({ 
      error: 'Please provide a valid YouTube URL (e.g., https://youtube.com/watch?v=VIDEO_ID)' 
    });
    return;
  }

  next();
};

export const validateUsageLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // This middleware is applied in the authenticate middleware
  // Additional usage validation can be added here if needed
  next();
};