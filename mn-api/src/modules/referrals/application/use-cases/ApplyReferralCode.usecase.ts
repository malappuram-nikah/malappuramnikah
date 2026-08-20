import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralValidator } from "../../domain/services/ReferralValidator";
import { ReferralEntity } from "../../domain/entities/referral.entity";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class ApplyReferralCodeUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(referredUserId: number, code: string): Promise<ReferralEntity> {
    ReferralValidator.validateReferralCodeFormat(code);

    const settings = await this.referralRepository.getSettings();
    ReferralValidator.validateSettings(settings);

    const formattedCode = code.trim().toUpperCase();
    const referrer = await this.referralRepository.findUserByReferralCode(formattedCode);
    if (!referrer) {
      throw new NotFoundError("Referral code does not exist.");
    }

    ReferralValidator.validateSelfReferral(referrer.id, referredUserId);

    const existingReferral = await this.referralRepository.findReferralByReferredUser(referredUserId);
    if (existingReferral) {
      throw new BadRequestError("User has already applied a referral code.");
    }

    return await this.referralRepository.createReferral(referrer.id, referredUserId, formattedCode);
  }
}
