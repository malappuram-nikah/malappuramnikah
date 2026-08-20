import { SendMessageUseCase } from "../../application/use-cases/SendMessage.usecase";
import { GetMessagesUseCase } from "../../application/use-cases/GetMessages.usecase";
import { GetUnreadMessageCountUseCase } from "../../application/use-cases/GetUnreadMessageCount.usecase";
import { IMessageRepository } from "../../domain/repositories/IMessageRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";
import prisma from "../../../../shared/database/prisma";

describe("Chat Module - Unit Tests", () => {
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

  describe("SendMessageUseCase", () => {
    it("should throw error if user attempts to send empty content", async () => {
      const useCase = new SendMessageUseCase(mockMessageRepo, mockBlockRepo);
      await expect(useCase.execute({ senderId: 1, receiverId: 2, content: "   " })).rejects.toThrow("Message content cannot be empty.");
    });

    it("should throw error if user attempts to message self", async () => {
      const useCase = new SendMessageUseCase(mockMessageRepo, mockBlockRepo);
      await expect(useCase.execute({ senderId: 1, receiverId: 1, content: "Hello" })).rejects.toThrow("You cannot send messages to yourself.");
    });

    it("should send message successfully when valid", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, status: "ACTIVE" } as any);
      mockBlockRepo.isBlockedEither.mockResolvedValue(false);
      mockMessageRepo.createMessage.mockResolvedValue({
        id: 100,
        sender_id: 1,
        receiver_id: 2,
        content: "Hello",
        is_read: false,
        created_at: new Date(),
      });

      const useCase = new SendMessageUseCase(mockMessageRepo, mockBlockRepo);
      const res = await useCase.execute({ senderId: 1, receiverId: 2, content: "Hello" });

      expect(res.id).toBe(100);
      expect(res.content).toBe("Hello");
    });
  });

  describe("GetUnreadMessageCountUseCase", () => {
    it("should return total unread count for user", async () => {
      mockMessageRepo.getUnreadCount.mockResolvedValue(5);
      const useCase = new GetUnreadMessageCountUseCase(mockMessageRepo);
      const res = await useCase.execute(1);

      expect(res.unreadCount).toBe(5);
    });
  });
});
