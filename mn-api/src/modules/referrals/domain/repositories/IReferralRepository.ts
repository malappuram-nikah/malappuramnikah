import {
  ReferralEntity,
  ReferralTransactionEntity,
  ReferralSettingsEntity,
  ReferralSummaryEntity,
} from "../entities/referral.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export interface IReferralRepository {
  findUserReferralCode(userId: number): Promise<string | null>;
  setUserReferralCode(userId: number, code: string): Promise<string>;
  findUserByReferralCode(code: string): Promise<{ id: number; referral_code: string | null } | null>;
  findReferral(referrerId: number, referredUserId: number): Promise<ReferralEntity | null>;
  findReferralByReferredUser(referredUserId: number): Promise<ReferralEntity | null>;
  createReferral(referrerId: number, referredUserId: number, code: string): Promise<ReferralEntity>;
  
  getSettings(): Promise<ReferralSettingsEntity>;
  
  // Atomic transaction methods
  executeRewardTransaction(
    referralId: number,
    referrerId: number,
    points: number,
    reason: string
  ): Promise<{ referral: ReferralEntity; transaction: ReferralTransactionEntity }>;

  executePointsTransaction(
    userId: number,
    points: number,
    type: "DEDUCT" | "REDEEM" | "EXPIRE",
    reason: string,
    referralId?: number
  ): Promise<ReferralTransactionEntity>;

  getReferralHistory(userId: number, page?: number, limit?: number): Promise<PaginatedResult<ReferralEntity>>;
  getTransactions(userId: number, page?: number, limit?: number): Promise<PaginatedResult<ReferralTransactionEntity>>;
  getSummary(userId: number): Promise<ReferralSummaryEntity>;
}
