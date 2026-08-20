import { SendMessageUseCase } from "../application/use-cases/SendMessage.usecase";
import { GetMessagesUseCase } from "../application/use-cases/GetMessages.usecase";
import { IMessageRepository } from "../domain/repositories/IMessageRepository";
import { IBlockRepository } from "../../interactions/domain/repositories/IBlockRepository";
import prisma from "../../../shared/database/prisma";

describe("Chat Module - Use Cases Suite", () => {
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
    it("should throw error if content is empty", async () => {
      const useCase = new SendMessageUseCase(mockMessageRepo, mockBlockRepo);
      await expect(
        useCase.execute({ senderId: 1, receiverId: 2, content: "  " })
      ).rejects.toThrow("Message content cannot be empty.");
    });

    it("should send message when users are active and not blocked", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 2, status: "ACTIVE" } as any);
      mockBlockRepo.isBlockedEither.mockResolvedValue(false);
      mockMessageRepo.createMessage.mockResolvedValue({
        id: 10,
        sender_id: 1,
        receiver_id: 2,
        content: "Salam",
        is_read: false,
        created_at: new Date(),
      });

      const useCase = new SendMessageUseCase(mockMessageRepo, mockBlockRepo);
      const res = await useCase.execute({ senderId: 1, receiverId: 2, content: "Salam" });

      expect(res.content).toBe("Salam");
    });
  });
});
