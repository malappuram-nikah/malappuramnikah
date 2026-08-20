import { SearchFilters } from "../entities/search.entity";

export interface ISearchRepository {
  searchProfiles(filters: SearchFilters, currentUserId: number): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; hasNext: boolean } }>;
  updateSearchPreferences(userId: number, preferences: any): Promise<any>;
  getUserPremiumStatus(userId: number): Promise<boolean>;
}
