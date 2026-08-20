import { IReferralRepository } from "../../domain/repositories/IReferralRepository";

export class GenerateReferralCodeUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number): Promise<{ referralCode: string }> {
    let code = await this.referralRepository.findUserReferralCode(userId);
    if (!code) {
      // Generate a unique 8-character code (e.g. MN10294X)
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `MN${userId}${randomSuffix}`;
      code = await this.referralRepository.setUserReferralCode(userId, code);
    }
    return { referralCode: code };
  }
}
