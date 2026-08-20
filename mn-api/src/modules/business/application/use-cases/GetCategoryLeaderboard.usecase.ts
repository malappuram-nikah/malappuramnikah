import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessRankingCalculator, RankedBusinessItem } from "../../domain/services/BusinessRankingCalculator";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export class GetCategoryLeaderboardUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(categoryId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<RankedBusinessItem>> {
    const rawProfiles = await this.businessRepository.getCategoryProfiles(categoryId);

    // Calculate ranked items (automatically filters out status !== ACTIVE and sorts deterministically)
    const rankedList = BusinessRankingCalculator.rankCategoryBusinesses(rawProfiles);

    const total = rankedList.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = rankedList.slice(startIndex, startIndex + limit);

    return {
      data: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
