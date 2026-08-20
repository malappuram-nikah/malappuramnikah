import { BadRequestError, ForbiddenError } from "../../../../shared/errors/AppError";
import { ReferralEntity, ReferralSettingsEntity } from "../entities/referral.entity";

export class ReferralValidator {
  static validateSelfReferral(referrerId: number, referredUserId: number): void {
    if (referrerId === referredUserId) {
      throw new BadRequestError("Self-referrals are strictly prohibited.");
    }
  }

  static validateReferralCodeFormat(code: string): void {
    if (!code || code.trim().length < 3) {
      throw new BadRequestError("Invalid referral code format.");
    }
  }

  static validateReferralNotRewarded(referral: ReferralEntity): void {
    if (referral.rewarded || referral.status === "COMPLETED") {
      throw new ForbiddenError("Referral has already been rewarded or completed.");
    }
  }

  static validateSufficientBalance(currentPoints: number, pointsToDeductOrRedeem: number): void {
    if (pointsToDeductOrRedeem <= 0) {
      throw new BadRequestError("Points value must be greater than zero.");
    }
    if (currentPoints < pointsToDeductOrRedeem) {
      throw new BadRequestError(`Insufficient referral points balance (${currentPoints} available, ${pointsToDeductOrRedeem} required).`);
    }
  }

  static validateSettings(settings: ReferralSettingsEntity): void {
    if (!settings.enabled) {
      throw new ForbiddenError("Referral program is currently disabled.");
    }
  }
}
