import { config } from './config';

export type SubscriptionType = 'FREE' | 'BASIC' | 'PREMIUM';

export class UsageLimits {
  /**
   * Get daily limit for a subscription type
   * Updated for GPT-4o Mini's improved cost efficiency
   */
  static getDailyLimit(subscriptionType: SubscriptionType): number {
    switch (subscriptionType) {
      case 'FREE':
        return config.usageLimits.free; // Can potentially increase due to lower costs
      case 'BASIC':
        return config.usageLimits.basic;
      case 'PREMIUM':
        return config.usageLimits.premium;
      default:
        return config.usageLimits.free;
    }
  }

  /**
   * Check if user can use AI features (summarization, chat)
   * Now powered by GPT-4o Mini for better performance and cost efficiency
   */
  static canUseAI(dailyUsage: number, subscriptionType: SubscriptionType): boolean {
    const limit = this.getDailyLimit(subscriptionType);
    return dailyUsage < limit;
  }

  /**
   * Get remaining usage for a subscription type
   */
  static getRemainingUsage(dailyUsage: number, subscriptionType: SubscriptionType): number {
    const limit = this.getDailyLimit(subscriptionType);
    return Math.max(0, limit - dailyUsage);
  }

  /**
   * Get all limits for display purposes
   */
  static getAllLimits() {
    return {
      FREE: config.usageLimits.free,
      BASIC: config.usageLimits.basic,
      PREMIUM: config.usageLimits.premium,
    };
  }

  /**
   * Get estimated cost per video with GPT-4o Mini
   * Used for internal cost tracking and optimization
   */
  static getEstimatedCostPerVideo(transcriptLength: number): number {
    // Rough estimation based on GPT-4o Mini pricing
    const averageTokens = transcriptLength / 3; // Approximate tokens
    const inputCost = (averageTokens / 1000000) * 0.15; // $0.15 per 1M input tokens
    const outputCost = (500 / 1000000) * 0.60; // Estimate 500 output tokens at $0.60 per 1M
    return inputCost + outputCost;
  }

  /**
   * Get model information for display purposes
   */
  static getModelInfo() {
    return {
      modelName: 'GPT-4o Mini',
      contextWindow: 128000,
      inputPricing: '$0.15 per 1M tokens',
      outputPricing: '$0.60 per 1M tokens',
      avgCostPerVideo: '~$0.01',
      improvements: [
        '8x larger context window vs GPT-3.5 Turbo',
        '70% lower cost than previous model',
        '40% faster text generation',
        'Better reasoning and accuracy'
      ]
    };
  }
}