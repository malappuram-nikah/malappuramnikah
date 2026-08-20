import prisma from "src/infrastructure/database/prisma.service";
import { BlockUserUseCase } from "../../application/use-cases/BlockUser.usecase";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";

describe("Interactions Module - Regression Tests", () => {
  let mockBlockRepo: jest.Mocked<IBlockRepository>;

  beforeEach(() => {
    mockBlockRepo = {
      findBlock: jest.fn(),
      isBlockedEither: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      getBlockedUsers: jest.fn(),
    };
  });

  it("should handle block user gracefully and invoke cleanup", async () => {
    mockBlockRepo.findBlock.mockResolvedValue(null);
    mockBlockRepo.blockUser.mockResolvedValue({ id: 1, blocker_id: 10, blocked_id: 20, created_at: new Date() });

    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 20, status: "ACTIVE" } as any);
    jest.spyOn(prisma.interest, "deleteMany").mockResolvedValue({ count: 1 });
    jest.spyOn(prisma.favourite, "deleteMany").mockResolvedValue({ count: 1 });

    const useCase = new BlockUserUseCase(mockBlockRepo);
    const res = await useCase.execute(10, 20);

    expect(res.message).toBe("User blocked successfully.");
    expect(mockBlockRepo.blockUser).toHaveBeenCalledWith(10, 20);
    expect(prisma.interest.deleteMany).toHaveBeenCalled();
    expect(prisma.favourite.deleteMany).toHaveBeenCalled();
  });
});
