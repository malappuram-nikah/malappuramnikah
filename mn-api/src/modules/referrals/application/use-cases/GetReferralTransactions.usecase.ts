import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import { ReferralTransactionEntity } from "../../domain/entities/referral.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export class GetReferralTransactionsUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<ReferralTransactionEntity>> {
    return await this.referralRepository.getTransactions(userId, page, limit);
  }
}
