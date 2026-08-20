import { AcceptInterestUseCase } from "../../application/use-cases/AcceptInterest.usecase";
import { RejectInterestUseCase } from "../../application/use-cases/RejectInterest.usecase";
import { WithdrawInterestUseCase } from "../../application/use-cases/WithdrawInterest.usecase";
import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";

describe("Interactions Module - Security & Authorization Tests", () => {
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
    };
  });

  it("should prevent unauthorized user from accepting someone else's incoming interest", async () => {
    // Interest is sent from user 10 to user 20
    mockInterestRepo.findInterestById.mockResolvedValue({
      id: 100,
      sender_id: 10,
      receiver_id: 20,
      status: "PENDING",
      created_at: new Date(),
      updated_at: new Date(),
    });

    const useCase = new AcceptInterestUseCase(mockInterestRepo, mockBlockRepo);
    // User 99 tries to accept user 20's interest
    await expect(useCase.execute(100, 99)).rejects.toThrow("You are not authorized to manipulate this interaction.");
  });

  it("should prevent unauthorized user from rejecting someone else's incoming interest", async () => {
    mockInterestRepo.findInterestById.mockResolvedValue({
      id: 100,
      sender_id: 10,
      receiver_id: 20,
      status: "PENDING",
      created_at: new Date(),
      updated_at: new Date(),
    });

    const useCase = new RejectInterestUseCase(mockInterestRepo);
    await expect(useCase.execute(100, 99)).rejects.toThrow("You are not authorized to manipulate this interaction.");
  });

  it("should prevent unauthorized user from withdrawing someone else's sent interest", async () => {
    mockInterestRepo.findInterestById.mockResolvedValue({
      id: 100,
      sender_id: 10,
      receiver_id: 20,
      status: "PENDING",
      created_at: new Date(),
      updated_at: new Date(),
    });

    const useCase = new WithdrawInterestUseCase(mockInterestRepo);
    await expect(useCase.execute(100, 20)).rejects.toThrow("You are not authorized to manipulate this interaction.");
  });
});
