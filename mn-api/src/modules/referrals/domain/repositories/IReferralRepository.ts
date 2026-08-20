import { ReferralEntity, ReferralTransactionEntity } from "../entities/referral.entity";

export interface IReferralRepository {
  findUserByReferralCode(code: string): Promise<{ id: number; first_name: string } | null>;
  getUserReferralInfo(userId: number): Promise<{ referralCode: string; points: number; stats: { total: number; successful: number; pending: number } } | null>;
  getReferralHistory(userId: number, page: number, limit: number): Promise<{ history: any[]; total: number }>;
  getReferralTransactions(userId: number, page: number, limit: number): Promise<{ transactions: ReferralTransactionEntity[]; total: number }>;
  redeemPoints(userId: number, pointsToRedeem: number): Promise<void>;
  generateUniqueCode(name: string): Promise<string>;
}
