import { SearchProfilesUseCase } from "../../application/use-cases/SearchProfiles.usecase";
import { ISearchRepository } from "../../domain/repositories/ISearchRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";

describe("Search Module - Unit Tests", () => {
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

  it("should fetch blocked users and pass excluded IDs to repository", async () => {
    mockBlockRepo.getBlockedUserIds.mockResolvedValue([20, 30]);
    mockSearchRepo.searchProfiles.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const useCase = new SearchProfilesUseCase(mockSearchRepo, mockBlockRepo);
    await useCase.execute({ gender: "Female" }, 10);

    expect(mockBlockRepo.getBlockedUserIds).toHaveBeenCalledWith(10);
    expect(mockSearchRepo.searchProfiles).toHaveBeenCalledWith(
      { gender: "Female" },
      10,
      [10, 20, 30]
    );
  });
});
