import { SearchCriteria, SearchResultItem } from "../entities/search-criteria.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export interface ISearchRepository {
  searchProfiles(criteria: SearchCriteria, requestingUserId?: number, excludedUserIds?: number[]): Promise<PaginatedResult<SearchResultItem>>;
}
