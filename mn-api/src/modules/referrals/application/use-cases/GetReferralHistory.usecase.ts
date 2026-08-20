import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralSummaryEntity, ReferralTransactionEntity } from "../../domain/entities/referral.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export class GetReferralHistoryUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number, page: number = 1, limit: number = 20): Promise<{
    summary: ReferralSummaryEntity;
    transactions: PaginatedResult<ReferralTransactionEntity>;
  }> {
    const [summary, transactions] = await Promise.all([
      this.referralRepository.getSummary(userId),
      this.referralRepository.getTransactions(userId, page, limit),
    ]);

    return { summary, transactions };
  }
}
