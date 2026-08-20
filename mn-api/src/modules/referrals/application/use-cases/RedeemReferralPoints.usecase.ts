import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralTransactionEntity } from "../../domain/entities/referral.entity";

export class RedeemReferralPointsUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number, pointsToRedeem: number): Promise<ReferralTransactionEntity> {
    return await this.referralRepository.executePointsTransaction(
      userId,
      pointsToRedeem,
      "REDEEM",
      "Points redemption"
    );
  }
}
