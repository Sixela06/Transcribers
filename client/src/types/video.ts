export interface VideoMetadata {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  channelName?: string;
  publishedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface VideoTranscript {
  segments: TranscriptSegment[];
  fullText: string;
  language?: string;
}

export interface VideoSummary {
  id: string;
  videoId: string;
  summary: string;
  keyPoints?: string[]; // Made optional since it might be undefined
  type: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS';
  createdAt: string;
}

export interface ProcessedVideo {
  id: string;
  youtubeId: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  channelName?: string;
  publishedAt?: Date | string;
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
  userId?: string;
  processedAt?: string;
}

// Request/Response types
export interface TranscribeRequest {
  youtubeUrl: string;
}

export interface SummarizeRequest {
  youtubeUrl: string;
  summaryType?: 'STANDARD' | 'DETAILED' | 'BULLET_POINTS';
}

export interface ChatRequest {
  videoId: string;
  message: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  videoId: string;
  videoTitle: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  message: string;
}