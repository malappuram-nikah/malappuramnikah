import { GetMessagesUseCase } from "../../application/use-cases/GetMessages.usecase";
import { IMessageRepository } from "../../domain/repositories/IMessageRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";

describe("Chat Module - Regression Tests", () => {
  let mockMessageRepo: jest.Mocked<IMessageRepository>;
  let mockBlockRepo: jest.Mocked<IBlockRepository>;

  beforeEach(() => {
    mockMessageRepo = {
      createMessage: jest.fn(),
      findMessageById: jest.fn(),
      getMessagesBetweenUsers: jest.fn(),
      getConversationsForUser: jest.fn(),
      markMessagesAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
    };

    mockBlockRepo = {
      findBlock: jest.fn(),
      isBlockedEither: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      getBlockedUsers: jest.fn(),
    };
  });

  it("should paginate messages between two users cleanly", async () => {
    mockBlockRepo.isBlockedEither.mockResolvedValue(false);
    mockMessageRepo.getMessagesBetweenUsers.mockResolvedValue({
      data: [{ id: 1, sender_id: 10, receiver_id: 20, content: "Test", is_read: false, created_at: new Date() }],
      total: 10,
      page: 1,
      limit: 1,
      totalPages: 10,
    });

    const useCase = new GetMessagesUseCase(mockMessageRepo, mockBlockRepo);
    const result = await useCase.execute(10, 20, 1, 1);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(10);
  });
});
