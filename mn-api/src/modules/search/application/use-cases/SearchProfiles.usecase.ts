import { ISearchRepository } from "../../domain/repositories/ISearchRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";
import { SearchCriteria, SearchResultItem } from "../../domain/entities/search-criteria.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export class SearchProfilesUseCase {
  constructor(
    private searchRepository: ISearchRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(criteria: SearchCriteria, requestingUserId?: number): Promise<PaginatedResult<SearchResultItem>> {
    let excludedUserIds: number[] = [];

    if (requestingUserId) {
      excludedUserIds.push(requestingUserId);
      const blockedIds = await this.blockRepository.getBlockedUserIds(requestingUserId);
      excludedUserIds.push(...blockedIds);
    }

    return await this.searchRepository.searchProfiles(criteria, requestingUserId, Array.from(new Set(excludedUserIds)));
  }
}
