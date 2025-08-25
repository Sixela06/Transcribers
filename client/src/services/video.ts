import { apiService } from './api';
import {
  TranscribeRequest,
  SummarizeRequest,
  VideoTranscript,
  VideoSummary,
  ProcessedVideo,
  VideoMetadata
} from '../types/video';
import { PaginatedResponse, UsageStats } from '../types/api';

export const transcribeVideo = async (data: TranscribeRequest): Promise<{ 
  metadata: VideoMetadata; 
  transcript: VideoTranscript;
}> => {
  return apiService.post<{ 
    metadata: VideoMetadata; 
    transcript: VideoTranscript;
  }>('/video/transcribe', data);
};

export const summarizeVideo = async (data: SummarizeRequest): Promise<{
  metadata: VideoMetadata;
  transcript: VideoTranscript;
  summary: VideoSummary;
}> => {
  return apiService.post<{
    metadata: VideoMetadata;
    transcript: VideoTranscript;
    summary: VideoSummary;
  }>('/video/summarize', data);
};

export const getProcessedVideos = async (
  page = 1, 
  limit = 10
): Promise<PaginatedResponse<ProcessedVideo>> => {
  return apiService.get<PaginatedResponse<ProcessedVideo>>(
    `/video?page=${page}&limit=${limit}`
  );
};

export const getVideoById = async (id: string): Promise<ProcessedVideo> => {
  return apiService.get<ProcessedVideo>(`/video/${id}`);
};

export const deleteVideo = async (id: string): Promise<void> => {
  return apiService.delete<void>(`/video/${id}`);
};

export const getUserUsageStats = async (): Promise<UsageStats> => {
  return apiService.get<UsageStats>('/user/usage');
};