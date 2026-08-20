import { GetNotificationsUseCase } from "../application/use-cases/GetNotifications.usecase";
import { MarkNotificationReadUseCase } from "../application/use-cases/MarkNotificationRead.usecase";
import { INotificationRepository } from "../domain/repositories/INotificationRepository";

describe("Notifications Module - Legacy Tests Suite", () => {
  let mockNotifRepo: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    mockNotifRepo = {
      createNotification: jest.fn(),
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getPreferences: jest.fn(),
      upsertPreferences: jest.fn(),
    };
  });

  describe("GetNotificationsUseCase", () => {
    it("should fetch user notifications", async () => {
      const useCase = new GetNotificationsUseCase(mockNotifRepo);
      mockNotifRepo.getNotifications.mockResolvedValue({
        data: [
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
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await useCase.execute(10);
      expect(result.data.length).toBe(1);
      expect(mockNotifRepo.getNotifications).toHaveBeenCalledWith(10, 1, 20);
    });
  });

  describe("MarkNotificationReadUseCase", () => {
    it("should mark notification as read when owned by user", async () => {
      const useCase = new MarkNotificationReadUseCase(mockNotifRepo);
      mockNotifRepo.markAsRead.mockResolvedValue(true);

      const res = await useCase.execute(1, 10);
      expect(res.success).toBe(true);
    });
  });
});
