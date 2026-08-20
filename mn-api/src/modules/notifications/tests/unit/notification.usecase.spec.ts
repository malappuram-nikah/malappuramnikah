import { CreateNotificationUseCase } from "../../application/use-cases/CreateNotification.usecase";
import { UpdateNotificationPreferencesUseCase } from "../../application/use-cases/UpdateNotificationPreferences.usecase";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { INotificationDeliveryService } from "../../../../shared/notifications/INotificationDeliveryService";

describe("Notifications Module - Unit Tests", () => {
  let mockNotificationRepo: jest.Mocked<INotificationRepository>;
  let mockDeliveryService: jest.Mocked<INotificationDeliveryService>;

  beforeEach(() => {
    mockNotificationRepo = {
      createNotification: jest.fn(),
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getPreferences: jest.fn(),
      upsertPreferences: jest.fn(),
    };

    mockDeliveryService = {
      sendInAppNotification: jest.fn(),
      sendEmailNotification: jest.fn(),
      sendSmsNotification: jest.fn(),
      sendPushNotification: jest.fn(),
    };
  });

  describe("CreateNotificationUseCase", () => {
    it("should create notification and invoke push delivery service if enabled", async () => {
      mockNotificationRepo.getPreferences.mockResolvedValue({
        id: 1,
        user_id: 10,
        email_notifications: false,
        sms_notifications: false,
        push_notifications: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      mockNotificationRepo.createNotification.mockResolvedValue({
        id: 100,
        user_id: 10,
        sender_id: 5,
        type: "GENERAL",
        title: "Test",
        message: "Hello",
        is_read: false,
        created_at: new Date(),
      });

      const useCase = new CreateNotificationUseCase(mockNotificationRepo, mockDeliveryService);
      const res = await useCase.execute({
        userId: 10,
        senderId: 5,
        type: "GENERAL",
        title: "Test",
        message: "Hello",
      });

      expect(res.id).toBe(100);
      expect(mockDeliveryService.sendPushNotification).toHaveBeenCalledWith(10, "Test", "Hello");
      expect(mockDeliveryService.sendEmailNotification).not.toHaveBeenCalled();
    });
  });

  describe("UpdateNotificationPreferencesUseCase", () => {
    it("should update notification preferences", async () => {
      mockNotificationRepo.getPreferences.mockResolvedValue(null);
      mockNotificationRepo.upsertPreferences.mockResolvedValue({
        id: 1,
        user_id: 10,
        email_notifications: false,
        sms_notifications: true,
        push_notifications: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const useCase = new UpdateNotificationPreferencesUseCase(mockNotificationRepo);
      const res = await useCase.execute({ userId: 10, emailNotifications: false });

      expect(res.email_notifications).toBe(false);
      expect(mockNotificationRepo.upsertPreferences).toHaveBeenCalledWith(10, false, true, true);
    });
  });
});
