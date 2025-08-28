export const APP_NAME = 'VideoScript';
export const APP_DESCRIPTION = 'Transform YouTube videos into actionable insights with AI-powered transcription and summarization using GPT-4o Mini.';

// Updated limits reflecting GPT-4o Mini's improved capabilities
export const FREE_PLAN_LIMITS = {
  DAILY_VIDEOS: 2,
  CHAT_MESSAGES_PER_VIDEO: 15, // Increased from 10 due to better efficiency
} as const;

export const PREMIUM_PLAN_LIMITS = {
  DAILY_VIDEOS: 50,
  CHAT_MESSAGES_PER_VIDEO: 150, // Increased from 100 due to better efficiency
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

// Updated limits for GPT-4o Mini's capabilities
export const MAX_VIDEO_DURATION = 7200; // Increased to 2 hours due to larger context window
export const MAX_TRANSCRIPT_LENGTH = 200000; // Increased from 50,000 characters
export const MAX_SUMMARY_LENGTH = 4000; // Increased from 2,000 characters

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
  VIDEO_TOO_LONG: 'Video is too long. Please try a video under 2 hours.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  SIGNUP: 'Account created successfully!',
  LOGOUT: 'Logged out successfully',
  VIDEO_PROCESSED: 'Video processed successfully with GPT-4o Mini!',
  MESSAGE_SENT: 'Message sent successfully!',
} as const;

// AI Model Information
export const AI_MODEL_INFO = {
  MODEL_NAME: 'GPT-4o Mini',
  MODEL_VERSION: 'gpt-4o-mini',
  CONTEXT_WINDOW: 128000,
  MAX_OUTPUT_TOKENS: 16384,
  DESCRIPTION: 'Advanced AI model optimized for speed and cost-efficiency',
  CAPABILITIES: [
    'Long context understanding (128K tokens)',
    'Multimodal input support',
    'High-speed text generation',
    'Superior reasoning capabilities'
  ]
} as const;

// Pricing information for transparency
export const PRICING_INFO = {
  INPUT_COST_PER_1M_TOKENS: 0.15, // $0.15 per 1M input tokens
  OUTPUT_COST_PER_1M_TOKENS: 0.60, // $0.60 per 1M output tokens
  ESTIMATED_COST_PER_VIDEO: 0.01, // ~$0.01 per typical video
  COST_SAVINGS_VS_PREVIOUS: '70%' // Cost savings vs GPT-3.5 Turbo
} as const;