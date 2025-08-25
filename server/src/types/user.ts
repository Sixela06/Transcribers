export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionType: string;
  dailyUsage: number;
  totalVideos: number;
  createdAt: Date;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UserStats {
  dailyUsage: number;
  dailyLimit: number;
  totalVideos: number;
  recentVideos: number;
  subscriptionType: string;
  memberSince: Date;
}