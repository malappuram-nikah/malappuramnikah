import { IReferralRepository } from "../../domain/repositories/IReferralRepository";

export class GetReferralTransactionsUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number, page: number, limit: number): Promise<{ transactions: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { transactions, total } = await this.referralRepository.getReferralTransactions(userId, page, limit);
    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
