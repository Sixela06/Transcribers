import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 5000, // Keep original default port
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,

  // External APIs
  openaiApiKey: process.env.OPENAI_API_KEY!,
  youtubeApiKey: process.env.YOUTUBE_API_KEY!,
  
  // CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // OpenAI Configuration - Updated for GPT-4o Mini
  openaiModel: {
    summarization: 'gpt-4o-mini',
    chat: 'gpt-4o-mini',
    fallback: 'gpt-3.5-turbo' // Fallback if needed
  },
  
  // GPT-4o Mini Specific Settings
  modelSettings: {
    'gpt-4o-mini': {
      maxTokens: 128000,
      maxOutputTokens: 16384,
      temperature: {
        summarization: 0.3,
        chat: 0.7
      },
      pricing: {
        inputCostPer1MTokens: 0.15,
        outputCostPer1MTokens: 0.60
      },
      rateLimits: {
        requestsPerMinute: 3000, // Higher rate limits than GPT-3.5
        tokensPerMinute: 200000
      }
    }
  },

  // Usage Limits (configurable for testing) - Updated for better cost efficiency
  usageLimits: {
    free: parseInt(process.env.FREE_DAILY_LIMIT || '2'), // Can potentially increase due to 70% cost reduction
    basic: parseInt(process.env.BASIC_DAILY_LIMIT || '20'),
    premium: parseInt(process.env.PREMIUM_DAILY_LIMIT || '100'),
  },
  
  // Feature Flags
  features: {
    enableGpt4oMini: true,
    enableLargeVideoProcessing: true, // Can handle 2+ hour videos now
    enableExtendedChat: true, // Longer chat context
    enableBatchProcessing: process.env.ENABLE_BATCH_PROCESSING === 'true',
    maxVideoLengthHours: parseInt(process.env.MAX_VIDEO_LENGTH_HOURS || '2')
  },
  
  // Performance Settings
  performance: {
    chunkSize: 50000, // Increased chunk size for GPT-4o Mini
    maxConcurrentRequests: 5,
    requestTimeout: 60000, // 60 seconds
    retryAttempts: 3
  },
  
  // Cost Optimization
  costOptimization: {
    enableSmartTruncation: true,
    truncationBufferPercent: 10, // Reduced from 15% due to larger context
    enableCaching: process.env.ENABLE_RESPONSE_CACHING === 'true',
    cacheExpirationHours: 24
  },
  
  // Monitoring and Analytics
  monitoring: {
    enableCostTracking: true,
    enablePerformanceMetrics: true,
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'YOUTUBE_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}