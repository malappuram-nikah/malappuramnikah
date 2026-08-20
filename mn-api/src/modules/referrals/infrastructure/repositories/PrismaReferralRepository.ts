import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import {
  ReferralEntity,
  ReferralTransactionEntity,
  ReferralSettingsEntity,
  ReferralSummaryEntity,
} from "../../domain/entities/referral.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";
import prisma from "../../../../shared/database/prisma";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors/AppError";

export class PrismaReferralRepository implements IReferralRepository {
  async findUserReferralCode(userId: number): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referral_code: true },
    });
    return user?.referral_code || null;
  }

  async setUserReferralCode(userId: number, code: string): Promise<string> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { referral_code: code },
      select: { referral_code: true },
    });
    return updated.referral_code!;
  }

  async findUserByReferralCode(code: string): Promise<{ id: number; referral_code: string | null } | null> {
    return await prisma.user.findUnique({
      where: { referral_code: code },
      select: { id: true, referral_code: true },
    });
  }

  async findReferral(referrerId: number, referredUserId: number): Promise<ReferralEntity | null> {
    const record = await prisma.referral.findFirst({
      where: { referrer_id: referrerId, referred_user_id: referredUserId },
    });
    return record as unknown as ReferralEntity;
  }

  async findReferralByReferredUser(referredUserId: number): Promise<ReferralEntity | null> {
    const record = await prisma.referral.findUnique({
      where: { referred_user_id: referredUserId },
    });
    return record as unknown as ReferralEntity;
  }

  async createReferral(referrerId: number, referredUserId: number, code: string): Promise<ReferralEntity> {
    const record = await prisma.referral.create({
      data: {
        referrer_id: referrerId,
        referred_user_id: referredUserId,
        referral_code: code,
        status: "PENDING",
        rewarded: false,
      },
    });
    return record as unknown as ReferralEntity;
  }

  async getSettings(): Promise<ReferralSettingsEntity> {
    let settings = await prisma.referralSettings.findFirst();
    if (!settings) {
      settings = await prisma.referralSettings.create({
        data: {
          points_per_referral: 100,
          reward_condition: "SIGNUP",
          enabled: true,
          max_referral: 100,
          daily_limit: 10,
        },
      });
    }
    return settings as unknown as ReferralSettingsEntity;
  }

  async executeRewardTransaction(
    referralId: number,
    referrerId: number,
    points: number,
    reason: string
  ): Promise<{ referral: ReferralEntity; transaction: ReferralTransactionEntity }> {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock the referral row with FOR UPDATE to prevent race conditions
      await tx.$executeRaw`SELECT id FROM "referral" WHERE id = ${referralId} FOR UPDATE`;

      const ref = await tx.referral.findUnique({ where: { id: referralId } });
      if (!ref) {
        throw new NotFoundError("Referral record not found.");
      }
      if (ref.rewarded || ref.status === "COMPLETED") {
        throw new ForbiddenError("Referral has already been rewarded or completed.");
      }

      // 2. Mark referral as COMPLETED & rewarded = true
      const updatedRef = await tx.referral.update({
        where: { id: referralId },
        data: { status: "COMPLETED", rewarded: true },
      });

      // 3. Atomically increment referrer points
      await tx.user.update({
        where: { id: referrerId },
        data: { referral_points: { increment: points } },
      });

      // 4. Create ReferralTransaction log entry
      const txLog = await tx.referralTransaction.create({
        data: {
          user_id: referrerId,
          referral_id: referralId,
          points,
          type: "EARN",
          reason,
        },
      });

      return {
        referral: updatedRef as unknown as ReferralEntity,
        transaction: txLog as unknown as ReferralTransactionEntity,
      };
    });
  }

  async executePointsTransaction(
    userId: number,
    points: number,
    type: "DEDUCT" | "REDEEM" | "EXPIRE",
    reason: string,
    referralId?: number
  ): Promise<ReferralTransactionEntity> {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock user row with FOR UPDATE for strict balance checking under concurrency
      await tx.$executeRaw`SELECT referral_points FROM "user" WHERE id = ${userId} FOR UPDATE`;

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { referral_points: true },
      });

      if (!user) {
        throw new NotFoundError("User not found.");
      }
      if (user.referral_points < points) {
        throw new ForbiddenError(`Insufficient referral points balance (${user.referral_points} available).`);
      }

      // 2. Atomically decrement points
      await tx.user.update({
        where: { id: userId },
        data: { referral_points: { decrement: points } },
      });

      // 3. Log transaction
      const txLog = await tx.referralTransaction.create({
        data: {
          user_id: userId,
          referral_id: referralId || null,
          points,
          type,
          reason,
        },
      });

      return txLog as unknown as ReferralTransactionEntity;
    });
  }

  async getReferralHistory(userId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<ReferralEntity>> {
    const skip = (page - 1) * limit;
    const where = { referrer_id: userId };

    const [total, records] = await Promise.all([
      prisma.referral.count({ where }),
      prisma.referral.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          referred_user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      data: records as unknown as ReferralEntity[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getTransactions(userId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<ReferralTransactionEntity>> {
    const skip = (page - 1) * limit;
    const where = { user_id: userId };

    const [total, records] = await Promise.all([
      prisma.referralTransaction.count({ where }),
      prisma.referralTransaction.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: records as unknown as ReferralTransactionEntity[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getSummary(userId: number): Promise<ReferralSummaryEntity> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referral_code: true, referral_points: true },
    });

    const [totalReferrals, completedReferrals, pendingReferrals] = await Promise.all([
      prisma.referral.count({ where: { referrer_id: userId } }),
      prisma.referral.count({ where: { referrer_id: userId, status: "COMPLETED" } }),
      prisma.referral.count({ where: { referrer_id: userId, status: "PENDING" } }),
    ]);

    return {
      referralCode: user?.referral_code || "",
      referralPoints: user?.referral_points || 0,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
    };
  }
}
