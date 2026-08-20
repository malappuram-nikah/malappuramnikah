export interface ReferralEntity {
  id: number;
  referrer_id: number;
  referred_user_id: number;
  referral_code: string;
  status: string; // PENDING, COMPLETED, CANCELLED
  rewarded: boolean;
  created_at: Date;
  referrer?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  referred_user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface ReferralTransactionEntity {
  id: number;
  user_id: number;
  referral_id?: number | null;
  points: number;
  type: string; // EARN, DEDUCT, REDEEM, EXPIRE
  reason: string;
  created_at: Date;
}

export interface ReferralSettingsEntity {
  id: number;
  points_per_referral: number;
  reward_condition: string;
  enabled: boolean;
  max_referral: number;
  daily_limit: number;
}

export interface ReferralSummaryEntity {
  referralCode: string;
  referralPoints: number;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
}
