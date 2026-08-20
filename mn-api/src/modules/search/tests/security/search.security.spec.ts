import { SearchProfilesUseCase } from "../../application/use-cases/SearchProfiles.usecase";
import { ISearchRepository } from "../../domain/repositories/ISearchRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";

describe("Search Module - Security & Exclusion Tests", () => {
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

  it("should ensure requesting user and their blocked contacts are in the exclusion list", async () => {
    mockBlockRepo.getBlockedUserIds.mockResolvedValue([55]);
    mockSearchRepo.searchProfiles.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const useCase = new SearchProfilesUseCase(mockSearchRepo, mockBlockRepo);
    await useCase.execute({ gender: "Male" }, 5);

    expect(mockSearchRepo.searchProfiles).toHaveBeenCalledWith(
      { gender: "Male" },
      5,
      expect.arrayContaining([5, 55])
    );
  });
});
