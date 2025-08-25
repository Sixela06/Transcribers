export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface VideoTranscript {
  segments: TranscriptSegment[];
  fullText: string;
}

export interface VideoSummary {
  id: string;
  videoId: string;
  summary: string;
  keyPoints: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  videoId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessedVideo {
  id: string;
  youtubeId: string;
  metadata: VideoMetadata;
  transcript: VideoTranscript;
  summary?: VideoSummary;
  chatSession?: ChatSession;
  processedAt: string;
  userId: string;
}

export interface TranscribeRequest {
  youtubeUrl: string;
}

export interface SummarizeRequest {
  youtubeUrl: string;
}

export interface ChatRequest {
  videoId: string;
  message: string;
}