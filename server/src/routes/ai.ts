import { Router } from 'express';
import { AIService } from '../services/aiService';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { UsageLimits } from '../utils/usageLimits';
import { config } from '../utils/config';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * POST /api/ai/summarize
 * Generate summary using GPT-4o Mini
 */
router.post('/summarize', authenticate, aiLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { transcript, summaryType = 'STANDARD' } = req.body;
    const user = req.user!;

    // Check usage limits
    if (!UsageLimits.canUseAI(user.dailyUsage, user.subscriptionType)) {
      return res.status(429).json({
        error: 'Daily limit exceeded',
        message: 'Upgrade to premium for unlimited access',
        remainingUsage: 0
      });
    }

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Log GPT-4o Mini usage
    console.log(`📝 GPT-4o Mini Summarization Request:`, {
      userId: user.id,
      transcriptLength: transcript.length,
      summaryType,
      model: config.openaiModel.summarization,
      estimatedTokens: Math.ceil(transcript.length / 3)
    });

    const startTime = Date.now();
    
    // Generate summary with GPT-4o Mini
    const summary = await AIService.summarizeTranscript(transcript, summaryType);
    
    const processingTime = Date.now() - startTime;
    
    // Log performance metrics
    console.log(`✅ GPT-4o Mini Summary Generated:`, {
      userId: user.id,
      processingTimeMs: processingTime,
      summaryLength: summary.length,
      model: config.openaiModel.summarization
    });

    // Estimate cost for monitoring
    const estimatedCost = UsageLimits.getEstimatedCostPerVideo(transcript.length);
    console.log(`💰 Estimated Cost: ${estimatedCost.toFixed(4)}`);

    res.json({
      summary,
      metadata: {
        summaryType,
        processingTime: processingTime,
        model: 'GPT-4o Mini',
        estimatedTokens: Math.ceil(transcript.length / 3),
        contextWindowUsed: `${Math.ceil((transcript.length / 3) / 1280)}%` // Percentage of 128K context used
      }
    });

  } catch (error: any) {
    console.error('❌ GPT-4o Mini Summarization Error:', {
      error: error.message,
      userId: req.userId,
      model: config.openaiModel.summarization
    });

    res.status(500).json({
      error: 'Summarization failed',
      message: 'Please try again. If the problem persists, try a shorter video.',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/chat
 * Chat with transcript using GPT-4o Mini
 */
router.post('/chat', authenticate, aiLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { transcript, message, chatHistory = [] } = req.body;
    const user = req.user!;

    // Check usage limits
    if (!UsageLimits.canUseAI(user.dailyUsage, user.subscriptionType)) {
      return res.status(429).json({
        error: 'Daily limit exceeded',
        message: 'Upgrade to premium for unlimited access'
      });
    }

    if (!transcript || !message) {
      return res.status(400).json({ error: 'Transcript and message are required' });
    }

    // Log GPT-4o Mini chat request
    console.log(`💬 GPT-4o Mini Chat Request:`, {
      userId: user.id,
      transcriptLength: transcript.length,
      messageLength: message.length,
      chatHistoryLength: chatHistory.length,
      model: config.openaiModel.chat,
      contextWindowUsage: Math.ceil((transcript.length + message.length) / 3)
    });

    const startTime = Date.now();
    
    // Generate response with GPT-4o Mini
    const response = await AIService.chatWithTranscript(transcript, message, chatHistory);
    
    const processingTime = Date.now() - startTime;

    // Log chat performance
    console.log(`✅ GPT-4o Mini Chat Response Generated:`, {
      userId: user.id,
      processingTimeMs: processingTime,
      responseLength: response.length,
      model: config.openaiModel.chat
    });

    res.json({
      response,
      metadata: {
        processingTime: processingTime,
        model: 'GPT-4o Mini',
        contextUsed: Math.ceil(((transcript.length + message.length) / 3) / 1280), // Percentage of 128K context
        chatHistoryCount: chatHistory.length
      }
    });

  } catch (error: any) {
    console.error('❌ GPT-4o Mini Chat Error:', {
      error: error.message,
      userId: req.userId,
      model: config.openaiModel.chat
    });

    res.status(500).json({
      error: 'Chat failed',
      message: 'Please try again with a shorter message or transcript.',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/model-info
 * Get current AI model information
 */
router.get('/model-info', (req, res) => {
  const modelInfo = UsageLimits.getModelInfo();
  
  res.json({
    ...modelInfo,
    configuration: {
      summarizationModel: config.openaiModel.summarization,
      chatModel: config.openaiModel.chat,
      contextWindow: config.modelSettings['gpt-4o-mini'].maxTokens,
      maxOutputTokens: config.modelSettings['gpt-4o-mini'].maxOutputTokens,
      features: config.features
    }
  });
});

/**
 * GET /api/ai/usage-stats
 * Get usage statistics and cost estimates
 */
router.get('/usage-stats', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const remainingUsage = UsageLimits.getRemainingUsage(user.dailyUsage, user.subscriptionType);
  
  res.json({
    dailyUsage: user.dailyUsage,
    remainingUsage,
    subscriptionType: user.subscriptionType,
    totalVideos: user.totalVideos,
    modelInfo: UsageLimits.getModelInfo(),
    costSavings: '70% lower cost vs previous model'
  });
});

export default router;