import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class ValidateReferralCodeUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(code: string, requesterId: number | null): Promise<{ referrerName: string }> {
    if (!code) {
      throw new BadRequestError("Referral code is required");
    }

    const referralUser = await this.referralRepository.findUserByReferralCode(code);
    if (!referralUser) {
      throw new NotFoundError("Referral code does not exist");
    }

    if (requesterId && referralUser.id === requesterId) {
      throw new BadRequestError("You cannot refer yourself");
    }

    return { referrerName: referralUser.first_name };
  }
}
