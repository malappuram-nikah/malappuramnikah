import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class GetMyReferralInfoUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number): Promise<{ referralCode: string; points: number; stats: { total: number; successful: number; pending: number } }> {
    const info = await this.referralRepository.getUserReferralInfo(userId);
    if (!info) {
      throw new NotFoundError("User not found");
    }
    return info;
  }
}
