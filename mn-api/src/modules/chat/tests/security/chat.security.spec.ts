import { SendMessageUseCase } from "../../application/use-cases/SendMessage.usecase";
import { GetMessagesUseCase } from "../../application/use-cases/GetMessages.usecase";
import { IMessageRepository } from "../../domain/repositories/IMessageRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";
import prisma from "../../../../shared/database/prisma";

describe("Chat Module - Security & Authorization Tests", () => {
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

  it("should prevent sending messages to a blocked user", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, status: "ACTIVE" } as any);
    mockBlockRepo.isBlockedEither.mockResolvedValue(true);

    const useCase = new SendMessageUseCase(mockMessageRepo, mockBlockRepo);
    await expect(useCase.execute({ senderId: 1, receiverId: 2, content: "Hello" })).rejects.toThrow(
      "Cannot send messages to a blocked user."
    );
  });

  it("should prevent retrieving messages with a blocked user", async () => {
    mockBlockRepo.isBlockedEither.mockResolvedValue(true);

    const useCase = new GetMessagesUseCase(mockMessageRepo, mockBlockRepo);
    await expect(useCase.execute(1, 2)).rejects.toThrow("Cannot send messages to a blocked user.");
  });

  it("should prevent sending messages to a suspended user account", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, status: "SUSPENDED" } as any);

    const useCase = new SendMessageUseCase(mockMessageRepo, mockBlockRepo);
    await expect(useCase.execute({ senderId: 1, receiverId: 2, content: "Hello" })).rejects.toThrow(
      "Cannot send messages to a suspended account."
    );
  });
});
