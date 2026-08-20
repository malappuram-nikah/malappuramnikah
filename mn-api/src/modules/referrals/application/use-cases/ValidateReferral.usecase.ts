import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralValidator } from "../../domain/services/ReferralValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class ValidateReferralUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(code: string, requestingUserId?: number): Promise<{ valid: boolean; referrerId: number }> {
    ReferralValidator.validateReferralCodeFormat(code);

    const settings = await this.referralRepository.getSettings();
    ReferralValidator.validateSettings(settings);

    const referrer = await this.referralRepository.findUserByReferralCode(code.trim().toUpperCase());
    if (!referrer) {
      throw new NotFoundError("Referral code not found or invalid.");
    }

    if (requestingUserId) {
      ReferralValidator.validateSelfReferral(referrer.id, requestingUserId);
    }

    return { valid: true, referrerId: referrer.id };
  }
}
