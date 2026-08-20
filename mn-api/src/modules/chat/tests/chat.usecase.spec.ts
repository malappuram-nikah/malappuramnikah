import { GetChatHistoryUseCase } from "../application/use-cases/GetChatHistory.usecase";
import { SendMessageUseCase } from "../application/use-cases/SendMessage.usecase";
import { IChatRepository } from "../domain/repositories/IChatRepository";
import { MessageEntity } from "../domain/entities/message.entity";

describe("Chat Module - Use Cases", () => {
  let mockChatRepo: jest.Mocked<IChatRepository>;

  beforeEach(() => {
    mockChatRepo = {
      verifyMutualMatch: jest.fn(),
      getChatHistory: jest.fn(),
      markMessagesAsRead: jest.fn(),
      createMessage: jest.fn(),
      getUserForChatCheck: jest.fn(),
      createMessageNotification: jest.fn(),
    };
  });

  describe("GetChatHistoryUseCase", () => {
    it("should throw ForbiddenError if users do not have a mutual match", async () => {
      const useCase = new GetChatHistoryUseCase(mockChatRepo);
      mockChatRepo.verifyMutualMatch.mockResolvedValue(false);

      await expect(useCase.execute(1, 2)).rejects.toThrow(
        "Chat locked. You must establish a mutual match to chat."
      );
    });

    it("should return chat history for mutually matched users", async () => {
      const useCase = new GetChatHistoryUseCase(mockChatRepo);
      mockChatRepo.verifyMutualMatch.mockResolvedValue(true);
      mockChatRepo.getChatHistory.mockResolvedValue([
        { id: 1, sender_id: 1, receiver_id: 2, content: "Hello", is_read: false, created_at: new Date() },
      ]);
      mockChatRepo.markMessagesAsRead.mockResolvedValue();

      const messages = await useCase.execute(1, 2);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe("Hello");
    });
  });

  describe("SendMessageUseCase", () => {
    it("should throw ForbiddenError with requireKyc flag if sender is not KYC verified", async () => {
      const useCase = new SendMessageUseCase(mockChatRepo);
      mockChatRepo.getUserForChatCheck.mockResolvedValue({
        id: 1,
        kyc_status: "NOT_SUBMITTED",
        first_name: "Ali",
        last_name: "K",
      });

      try {
        await useCase.execute(1, 2, "Hello");
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.requireKyc).toBe(true);
      }
    });

    it("should send message and create notification when verified and matched", async () => {
      const useCase = new SendMessageUseCase(mockChatRepo);
      mockChatRepo.getUserForChatCheck.mockResolvedValue({
        id: 1,
        kyc_status: "VERIFIED",
        first_name: "Ali",
        last_name: "K",
      });
      mockChatRepo.verifyMutualMatch.mockResolvedValue(true);
      mockChatRepo.createMessage.mockResolvedValue({
        id: 10,
        sender_id: 1,
        receiver_id: 2,
        content: "Salam",
        is_read: false,
        created_at: new Date(),
      });
      mockChatRepo.createMessageNotification.mockResolvedValue();

      const res = await useCase.execute(1, 2, "Salam");
      expect(res.message.content).toBe("Salam");
      expect(mockChatRepo.createMessageNotification).toHaveBeenCalledWith(2, 1, "Ali K", "Salam");
    });
  });
});
