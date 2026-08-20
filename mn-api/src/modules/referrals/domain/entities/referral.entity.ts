export interface ReferralEntity {
  id: number;
  referrer_id: number;
  referred_user_id: number;
  referral_code: string;
  status: string;
  rewarded: boolean;
  created_at: Date;
}

export interface ReferralTransactionEntity {
  id: number;
  user_id: number;
  referral_id?: number | null;
  points: number;
  type: string;
  reason: string;
  created_at: Date;
}
