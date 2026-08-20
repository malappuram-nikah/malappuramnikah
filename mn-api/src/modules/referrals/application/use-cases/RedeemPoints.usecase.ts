import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralValidator } from "../../domain/services/ReferralValidator";
import { ReferralTransactionEntity } from "../../domain/entities/referral.entity";
import prisma from "../../../../shared/database/prisma";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class RedeemPointsUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number, points: number, reason: string = "Points redemption"): Promise<ReferralTransactionEntity> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referral_points: true },
    });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    ReferralValidator.validateSufficientBalance(user.referral_points, points);

    return await this.referralRepository.executePointsTransaction(userId, points, "REDEEM", reason);
  }
}
