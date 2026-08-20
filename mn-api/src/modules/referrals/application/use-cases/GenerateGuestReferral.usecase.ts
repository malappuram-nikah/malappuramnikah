import { IReferralRepository } from "../../domain/repositories/IReferralRepository";

export class GenerateGuestReferralUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(name: string): Promise<string> {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GUEST-${name.toUpperCase().substring(0, 3)}-${randomSuffix}`;
  }
}
