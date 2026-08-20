import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export class GenerateGuestReferralUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(name: string, mobileNumber: string): Promise<string> {
    if (!name || !mobileNumber) {
      throw new BadRequestError("Name and Mobile Number are required");
    }
    return await this.referralRepository.generateUniqueCode(name);
  }
}
