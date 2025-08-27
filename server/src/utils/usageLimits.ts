import { config } from './config';

export type SubscriptionType = 'FREE' | 'BASIC' | 'PREMIUM';

export class UsageLimits {
  /**
   * Get daily limit for a subscription type
   */
  static getDailyLimit(subscriptionType: SubscriptionType): number {
    switch (subscriptionType) {
      case 'FREE':
        return config.usageLimits.free;
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
}