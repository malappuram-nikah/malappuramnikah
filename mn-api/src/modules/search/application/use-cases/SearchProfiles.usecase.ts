import { ISearchRepository } from "../../domain/repositories/ISearchRepository";
import { SearchFilters } from "../../domain/entities/search.entity";

export class SearchProfilesUseCase {
  constructor(private searchRepository: ISearchRepository) {}

  async execute(filters: SearchFilters, currentUserId: number): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; hasNext: boolean } }> {
    const isPremiumUser = await this.searchRepository.getUserPremiumStatus(currentUserId);
    const safeFilters = { ...filters, isPremiumUser };

    if (!isPremiumUser) {
      delete safeFilters.familyStatus;
      delete safeFilters.financialStatus;
      delete safeFilters.professionType;
      delete safeFilters.bodyType;
      delete safeFilters.ethnicity;
      delete safeFilters.eatingHabits;
      delete safeFilters.drinkingHabits;
      delete safeFilters.religiousness;
      delete safeFilters.prayer;
      delete safeFilters.hijab;
      delete safeFilters.beard;
    }

    return await this.searchRepository.searchProfiles(safeFilters, currentUserId);
  }
}
