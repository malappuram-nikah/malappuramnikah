import { SendInterestUseCase } from "../../application/use-cases/SendInterest.usecase";
import { BlockUserUseCase } from "../../application/use-cases/BlockUser.usecase";
import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import prisma from "../../../../shared/database/prisma";

describe("Interactions Module - Security Tests", () => {
  let mockInterestRepo: jest.Mocked<IInterestRepository>;
  let mockBlockRepo: jest.Mocked<IBlockRepository>;

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
  });

  it("should prevent sending interest to self", async () => {
    const useCase = new SendInterestUseCase(mockInterestRepo, mockBlockRepo);
    await expect(useCase.execute({ senderId: 10, receiverId: 10 })).rejects.toThrow("You cannot send interest to yourself.");
  });

  it("should prevent sending interest if target user has blocked sender", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 20, status: "ACTIVE" } as any);
    mockBlockRepo.isBlockedEither.mockResolvedValue(true);
    const useCase = new SendInterestUseCase(mockInterestRepo, mockBlockRepo);
    await expect(useCase.execute({ senderId: 10, receiverId: 20 })).rejects.toThrow("Cannot interact with a blocked user.");
  });

  it("should prevent self-blocking", async () => {
    const useCase = new BlockUserUseCase(mockBlockRepo);
    await expect(useCase.execute(10, 10)).rejects.toThrow("You cannot block yourself.");
  });
});
