import { SendInterestUseCase } from "../../application/use-cases/SendInterest.usecase";
import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { IFavouriteRepository } from "../../domain/repositories/IFavouriteRepository";
import { IProfileViewRepository } from "../../domain/repositories/IProfileViewRepository";
import prisma from "../../../../shared/database/prisma";

describe("Interactions Module - Unit Tests", () => {
  let mockInterestRepo: jest.Mocked<IInterestRepository>;
  let mockBlockRepo: jest.Mocked<IBlockRepository>;
  let mockFavouriteRepo: jest.Mocked<IFavouriteRepository>;
  let mockViewRepo: jest.Mocked<IProfileViewRepository>;

  beforeEach(() => {
    mockInterestRepo = {
      findInterest: jest.fn(),
      findInterestById: jest.fn(),
      createInterest: jest.fn(),
      updateInterestStatus: jest.fn(),
      deleteInterest: jest.fn(),
      getSentInterests: jest.fn(),
      getReceivedInterests: jest.fn(),
    };

    mockBlockRepo = {
      findBlock: jest.fn(),
      isBlockedEither: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      getBlockedUsers: jest.fn(),
      getBlockedUserIds: jest.fn(),
    };

    mockFavouriteRepo = {
      findFavourite: jest.fn(),
      addFavourite: jest.fn(),
      removeFavourite: jest.fn(),
      getFavourites: jest.fn(),
    };

    mockViewRepo = {
      findView: jest.fn(),
      recordView: jest.fn(),
      getViewsGiven: jest.fn(),
      getViewsReceived: jest.fn(),
    };
  });

  describe("SendInterestUseCase", () => {
    it("should throw error if user is blocked", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, status: "ACTIVE" } as any);
      mockBlockRepo.isBlockedEither.mockResolvedValue(true);
      const useCase = new SendInterestUseCase(mockInterestRepo, mockBlockRepo);
      await expect(useCase.execute({ senderId: 1, receiverId: 2 })).rejects.toThrow("Cannot interact with a blocked user.");
    });

    it("should send interest when non-blocked and active", async () => {
      mockBlockRepo.isBlockedEither.mockResolvedValue(false);
      mockInterestRepo.findInterest.mockResolvedValue(null);
      mockInterestRepo.createInterest.mockResolvedValue({
        id: 1,
        sender_id: 1,
        receiver_id: 2,
        status: "PENDING",
        created_at: new Date(),
        updated_at: new Date(),
      });
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, status: "ACTIVE" } as any);

      const useCase = new SendInterestUseCase(mockInterestRepo, mockBlockRepo);
      const res = await useCase.execute({ senderId: 1, receiverId: 2 });

      expect(res.status).toBe("PENDING");
      expect(mockInterestRepo.createInterest).toHaveBeenCalledWith(1, 2);
    });
  });
});
