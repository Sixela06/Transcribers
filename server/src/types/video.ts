export interface VideoData {
  id: string;
  youtubeId: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  channelName?: string;
  publishedAt?: Date;
  status: string;
  transcript?: {
    content: string;
    language?: string;
  };
  summaries?: Array<{
    id: string;
    content: string;
    type: string;
  }>;
}

export interface TranscribeRequest {
  url: string;
}

export interface SummarizeRequest {
  url: string;
  summaryType?: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS';
}