export const APP_NAME = 'VideoScript';
export const APP_DESCRIPTION = 'Transform YouTube videos into actionable insights with AI-powered transcription and summarization.';

export const FREE_PLAN_LIMITS = {
  DAILY_VIDEOS: 2,
  CHAT_MESSAGES_PER_VIDEO: 10,
} as const;

export const PREMIUM_PLAN_LIMITS = {
  DAILY_VIDEOS: 50,
  CHAT_MESSAGES_PER_VIDEO: 100,
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

export const MAX_VIDEO_DURATION = 3600; // 1 hour in seconds
export const MAX_TRANSCRIPT_LENGTH = 50000; // characters
export const MAX_SUMMARY_LENGTH = 2000; // characters

export const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'
] as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You need to be logged in to perform this action.',
  VIDEO_NOT_FOUND: 'Video not found or unavailable.',
  TRANSCRIPT_UNAVAILABLE: 'Transcript is not available for this video.',
  DAILY_LIMIT_EXCEEDED: 'You have reached your daily limit. Upgrade to premium for unlimited access.',
  INVALID_VIDEO_URL: 'Please enter a valid YouTube URL.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  SIGNUP: 'Account created successfully!',
  LOGOUT: 'Logged out successfully',
  VIDEO_PROCESSED: 'Video processed successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
} as const;