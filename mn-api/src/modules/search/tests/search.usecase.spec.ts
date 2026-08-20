import { SearchProfilesUseCase } from "../application/use-cases/SearchProfiles.usecase";
import { ISearchRepository } from "../domain/repositories/ISearchRepository";

describe("Search Module - Use Cases", () => {
  let mockSearchRepo: jest.Mocked<ISearchRepository>;

  beforeEach(() => {
    mockSearchRepo = {
      searchProfiles: jest.fn(),
      updateSearchPreferences: jest.fn(),
      getUserPremiumStatus: jest.fn(),
    };
  });

  describe("SearchProfilesUseCase", () => {
    it("should strip premium filters if user is not a premium member", async () => {
      const useCase = new SearchProfilesUseCase(mockSearchRepo);
      mockSearchRepo.getUserPremiumStatus.mockResolvedValue(false);
      mockSearchRepo.searchProfiles.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, hasNext: false },
      });

      await useCase.execute(
        {
          gender: "female",
          familyStatus: ["Upper Middle Class"],
          financialStatus: ["Wealthy"],
        },
        1
      );

      expect(mockSearchRepo.searchProfiles).toHaveBeenCalledWith(
        expect.objectContaining({
          isPremiumUser: false,
          gender: "female",
        }),
        1
      );

      const passedFilters = mockSearchRepo.searchProfiles.mock.calls[0][0];
      expect(passedFilters.familyStatus).toBeUndefined();
      expect(passedFilters.financialStatus).toBeUndefined();
    });

    it("should preserve premium filters if user is a premium member", async () => {
      const useCase = new SearchProfilesUseCase(mockSearchRepo);
      mockSearchRepo.getUserPremiumStatus.mockResolvedValue(true);
      mockSearchRepo.searchProfiles.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, hasNext: false },
      });

      await useCase.execute(
        {
          gender: "female",
          familyStatus: ["Upper Middle Class"],
        },
        1
      );

      expect(mockSearchRepo.searchProfiles).toHaveBeenCalledWith(
        expect.objectContaining({
          isPremiumUser: true,
          familyStatus: ["Upper Middle Class"],
        }),
        1
      );
    });
  });
});
