import { IReferralRepository } from "../../domain/repositories/IReferralRepository";

export class GetReferralHistoryUseCase {
  constructor(private referralRepository: IReferralRepository) {}

  async execute(userId: number, page: number, limit: number): Promise<{ history: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { history, total } = await this.referralRepository.getReferralHistory(userId, page, limit);
    return {
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
