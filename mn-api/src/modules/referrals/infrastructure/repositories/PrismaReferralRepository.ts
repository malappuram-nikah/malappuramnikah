import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralTransactionEntity } from "../../domain/entities/referral.entity";
import { prisma, runInTransaction } from "../../../../infrastructure/database/prisma.service";

export class PrismaReferralRepository implements IReferralRepository {
  async findUserByReferralCode(code: string): Promise<{ id: number; first_name: string } | null> {
    const user = await prisma.user.findUnique({
      where: { referral_code: code },
      select: { id: true, first_name: true },
    });
    return user;
  }

  async getUserReferralInfo(userId: number): Promise<{ referralCode: string; points: number; stats: { total: number; successful: number; pending: number } } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    const totalReferrals = await prisma.referral.count({ where: { referrer_id: userId } });
    const successfulReferrals = await prisma.referral.count({ where: { referrer_id: userId, status: "SUCCESS" } });
    const pendingReferrals = await prisma.referral.count({ where: { referrer_id: userId, status: "PENDING" } });

    let currentCode = user.referral_code;
    if (!currentCode) {
      currentCode = await this.generateUniqueCode(user.first_name);
      await prisma.user.update({
        where: { id: userId },
        data: { referral_code: currentCode },
      });
    }

    return {
      referralCode: currentCode,
      points: user.referral_points,
      stats: {
        total: totalReferrals,
        successful: successfulReferrals,
        pending: pendingReferrals,
      },
    };
  }

  async getReferralHistory(userId: number, page: number, limit: number): Promise<{ history: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const referrals = await prisma.referral.findMany({
      where: { referrer_id: userId },
      include: {
        referred_user: {
          select: {
            first_name: true,
            last_name: true,
            mobile_number: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.referral.count({ where: { referrer_id: userId } });

    const history = referrals.map((r) => ({
      id: r.id,
      name: `${r.referred_user.first_name} ${r.referred_user.last_name}`.trim(),
      mobile: r.referred_user.mobile_number,
      joinedDate: r.created_at,
      status: r.status,
      rewarded: r.rewarded,
    }));

    return { history, total };
  }

  async getReferralTransactions(userId: number, page: number, limit: number): Promise<{ transactions: ReferralTransactionEntity[]; total: number }> {
    const skip = (page - 1) * limit;

    const transactions = await prisma.referralTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.referralTransaction.count({ where: { user_id: userId } });

    return { transactions: transactions as unknown as ReferralTransactionEntity[], total };
  }

  async redeemPoints(userId: number, pointsToRedeem: number): Promise<void> {
    await runInTransaction(async (tx) => {
      await tx.referralTransaction.create({
        data: {
          user_id: userId,
          points: -pointsToRedeem,
          type: "REDEEM",
          reason: "Redeemed Reward Voucher",
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          referral_points: { decrement: pointsToRedeem },
        },
      });
      await tx.notification.create({
        data: {
          user_id: userId,
          sender_id: 1,
          type: "REFERRAL_REDEEM",
          title: "Voucher Redeemed! 🎁",
          message: `You successfully redeemed ${pointsToRedeem} points. Your voucher details will be sent to your mobile shortly.`,
        },
      });
    });
  }

  async generateUniqueCode(name: string): Promise<string> {
    const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase() || "USER";
    let isUnique = false;
    let code = "";
    while (!isUnique) {
      code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
      const existing = await prisma.user.findUnique({ where: { referral_code: code } });
      if (!existing) isUnique = true;
    }
    return code;
  }
}
