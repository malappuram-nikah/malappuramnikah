import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralValidator } from "../../domain/services/ReferralValidator";
import { ReferralEntity, ReferralTransactionEntity } from "../../domain/entities/referral.entity";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class RewardReferralUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(referrerId: number, referredUserId: number): Promise<{ referral: ReferralEntity; transaction: ReferralTransactionEntity }> {
    const settings = await this.referralRepository.getSettings();
    ReferralValidator.validateSettings(settings);

    const referral = await this.referralRepository.findReferral(referrerId, referredUserId);
    if (!referral) {
      throw new NotFoundError("Referral record not found.");
    }

    ReferralValidator.validateReferralNotRewarded(referral);

    const points = settings.points_per_referral || 100;
    const reason = `Reward for referring User #${referredUserId}`;

    // Execute atomic transaction: update referral status + reward points + log transaction
    return await this.referralRepository.executeRewardTransaction(referral.id, referrerId, points, reason);
  }
}
