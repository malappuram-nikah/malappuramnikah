import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralSummaryEntity } from "../../domain/entities/referral.entity";

export class GetMyReferralInfoUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number): Promise<ReferralSummaryEntity> {
    return await this.referralRepository.getSummary(userId);
  }
}
