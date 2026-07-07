import { SearchRepository, SearchFilters } from "../../infrastructure/database/SearchRepository";

export class SearchService {
  private searchRepository: SearchRepository;

  constructor() {
    this.searchRepository = new SearchRepository();
  }

  async searchProfiles(filters: SearchFilters, currentUserId: number, isPremiumUser: boolean) {
    // Ensure premium filters are only applied if the user is premium
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

  async updateSearchPreferences(userId: number, preferences: any) {
    return await this.searchRepository.updateSearchPreferences(userId, preferences);
  }
}
