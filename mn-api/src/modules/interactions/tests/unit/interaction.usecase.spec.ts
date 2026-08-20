import { SendInterestUseCase } from "../../application/use-cases/SendInterest.usecase";
import { AcceptInterestUseCase } from "../../application/use-cases/AcceptInterest.usecase";
import { RejectInterestUseCase } from "../../application/use-cases/RejectInterest.usecase";
import { WithdrawInterestUseCase } from "../../application/use-cases/WithdrawInterest.usecase";
import { BlockUserUseCase } from "../../application/use-cases/BlockUser.usecase";
import { UnblockUserUseCase } from "../../application/use-cases/UnblockUser.usecase";
import { FavouriteUserUseCase } from "../../application/use-cases/FavouriteUser.usecase";
import { RemoveFavouriteUseCase } from "../../application/use-cases/RemoveFavourite.usecase";
import { RecordProfileViewUseCase } from "../../application/use-cases/RecordProfileView.usecase";
import { GetInteractionHistoryUseCase } from "../../application/use-cases/GetInteractionHistory.usecase";

import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { IFavouriteRepository } from "../../domain/repositories/IFavouriteRepository";
import { IProfileViewRepository } from "../../domain/repositories/IProfileViewRepository";

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
    it("should throw error if user tries to send interest to self", async () => {
      const useCase = new SendInterestUseCase(mockInterestRepo, mockBlockRepo);
      await expect(useCase.execute({ senderId: 1, receiverId: 1 })).rejects.toThrow("You cannot send interest to yourself.");
    });
  });

  describe("BlockUserUseCase & UnblockUserUseCase", () => {
    it("should throw error when unblocking non-existent block record", async () => {
      mockBlockRepo.findBlock.mockResolvedValue(null);
      const useCase = new UnblockUserUseCase(mockBlockRepo);
      await expect(useCase.execute(1, 2)).rejects.toThrow("Block record not found.");
    });
  });

  describe("GetInteractionHistoryUseCase", () => {
    it("should aggregate all interaction categories for user", async () => {
      mockInterestRepo.getSentInterests.mockResolvedValue([{ id: 1 } as any]);
      mockInterestRepo.getReceivedInterests.mockResolvedValue([]);
      mockBlockRepo.getBlockedUsers.mockResolvedValue([]);
      mockFavouriteRepo.getFavourites.mockResolvedValue([]);
      mockViewRepo.getViewsGiven.mockResolvedValue([]);

      const useCase = new GetInteractionHistoryUseCase(mockInterestRepo, mockBlockRepo, mockFavouriteRepo, mockViewRepo);
      const res = await useCase.execute(1);

      expect(res.sentInterests).toHaveLength(1);
      expect(res.receivedInterests).toHaveLength(0);
    });
  });
});
