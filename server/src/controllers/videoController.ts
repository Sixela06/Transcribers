import { Request, Response } from 'express';
import { VideoService } from '../services/videoService';
import { validateTranscribeRequest, validateSummarizeRequest } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

export class VideoController {
  static async transcribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error } = validateTranscribeRequest(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const { url } = req.body;
      // Use req.userId (which might be null/undefined for unauthenticated users)
      const result = await VideoService.transcribeVideo(req.userId || null, url);
      
      res.json(result);
    } catch (error: any) {
      console.error('Transcribe error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async summarize(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error } = validateSummarizeRequest(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const { url, summaryType = 'STANDARD' } = req.body;
      const result = await VideoService.summarizeVideo(req.userId!, url, summaryType);
      
      res.json(result);
    } catch (error: any) {
      console.error('Summarize error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await VideoService.getVideo(id, req.userId!);
      
      res.json(result);
    } catch (error: any) {
      console.error('Get video error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async getUserVideos(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await VideoService.getUserVideos(req.userId!);
      res.json(result);
    } catch (error: any) {
      console.error('Get user videos error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VideoService.deleteVideo(id, req.userId!);
      
      res.json({ message: 'Video deleted successfully' });
    } catch (error: any) {
      console.error('Delete video error:', error);
      res.status(404).json({ error: error.message });
    }
  }
}