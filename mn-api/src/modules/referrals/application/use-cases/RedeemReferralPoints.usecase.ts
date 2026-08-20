import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class RedeemReferralPointsUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number, points: any): Promise<void> {
    const pointsToRedeem = parseInt(points, 10);
    if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
      throw new BadRequestError("Invalid points amount");
    }

    const info = await this.referralRepository.getUserReferralInfo(userId);
    if (!info) {
      throw new NotFoundError("User not found");
    }

    if (info.points < pointsToRedeem) {
      throw new BadRequestError("Insufficient referral points");
    }

    await this.referralRepository.redeemPoints(userId, pointsToRedeem);
  }
}
