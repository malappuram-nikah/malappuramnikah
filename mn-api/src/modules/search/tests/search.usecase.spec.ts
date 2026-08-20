import { SearchProfilesUseCase } from "../application/use-cases/SearchProfiles.usecase";
import { ISearchRepository } from "../domain/repositories/ISearchRepository";
import { IBlockRepository } from "../../interactions/domain/repositories/IBlockRepository";

describe("Search Module - Legacy Test Suite", () => {
  let mockSearchRepo: jest.Mocked<ISearchRepository>;
  let mockBlockRepo: jest.Mocked<IBlockRepository>;

  beforeEach(() => {
    mockSearchRepo = {
      searchProfiles: jest.fn(),
    };

    mockBlockRepo = {
      findBlock: jest.fn(),
      isBlockedEither: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      getBlockedUsers: jest.fn(),
      getBlockedUserIds: jest.fn(),
    };
  });

  describe("SearchProfilesUseCase", () => {
    it("should execute search and exclude blocked users", async () => {
      const useCase = new SearchProfilesUseCase(mockSearchRepo, mockBlockRepo);
      mockBlockRepo.getBlockedUserIds.mockResolvedValue([99]);
      mockSearchRepo.searchProfiles.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await useCase.execute({ gender: "Female" }, 1);

      expect(mockSearchRepo.searchProfiles).toHaveBeenCalledWith(
        { gender: "Female" },
        1,
        [1, 99]
      );
    });
  });
});
