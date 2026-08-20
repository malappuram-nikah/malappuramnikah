import { GetUserNotificationsUseCase } from "../application/use-cases/GetUserNotifications.usecase";
import { MarkNotificationReadUseCase } from "../application/use-cases/MarkNotificationRead.usecase";
import { INotificationRepository } from "../domain/repositories/INotificationRepository";

describe("Notifications Module - Use Cases", () => {
  let mockNotifRepo: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    mockNotifRepo = {
      getNotifications: jest.fn(),
      markAllAsRead: jest.fn(),
      markAsRead: jest.fn(),
    };
  });

  describe("GetUserNotificationsUseCase", () => {
    it("should fetch user notifications", async () => {
      const useCase = new GetUserNotificationsUseCase(mockNotifRepo);
      mockNotifRepo.getNotifications.mockResolvedValue([
        {
          id: 1,
          user_id: 10,
          sender_id: 2,
          type: "INTEREST_SENT",
          title: "New Interest",
          message: "Someone is interested",
          is_read: false,
          created_at: new Date(),
        },
      ]);

      const result = await useCase.execute(10);
      expect(result.length).toBe(1);
      expect(mockNotifRepo.getNotifications).toHaveBeenCalledWith(10);
    });
  });

  describe("MarkNotificationReadUseCase", () => {
    it("should throw NotFoundError if notification does not exist or user does not own it", async () => {
      const useCase = new MarkNotificationReadUseCase(mockNotifRepo);
      mockNotifRepo.markAsRead.mockResolvedValue(null);

      await expect(useCase.execute(99, 10)).rejects.toThrow("Notification not found");
    });

    it("should mark notification as read when owned by user", async () => {
      const useCase = new MarkNotificationReadUseCase(mockNotifRepo);
      mockNotifRepo.markAsRead.mockResolvedValue({
        id: 1,
        user_id: 10,
        sender_id: 2,
        type: "INTEREST_SENT",
        title: "New Interest",
        message: "Someone is interested",
        is_read: true,
        created_at: new Date(),
      });

      const res = await useCase.execute(1, 10);
      expect(res.is_read).toBe(true);
    });
  });
});
