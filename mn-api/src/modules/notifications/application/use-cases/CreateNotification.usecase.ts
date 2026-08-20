import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { INotificationDeliveryService } from "../../../../shared/notifications/INotificationDeliveryService";
import { NotificationEntity } from "../../domain/entities/notification.entity";

export interface CreateNotificationDto {
  userId: number;
  senderId: number;
  type: string;
  title: string;
  message: string;
}

export class CreateNotificationUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private deliveryService: INotificationDeliveryService
  ) {}

  async execute(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const preferences = await this.notificationRepository.getPreferences(dto.userId);

    const notification = await this.notificationRepository.createNotification(
      dto.userId,
      dto.senderId,
      dto.type,
      dto.title,
      dto.message
    );

    // Dispatch external channels based on user notification preferences
    if (!preferences || preferences.push_notifications) {
      await this.deliveryService.sendPushNotification(dto.userId, dto.title, dto.message);
    }
    if (preferences?.email_notifications) {
      await this.deliveryService.sendEmailNotification(dto.userId, dto.title, dto.message);
    }
    if (preferences?.sms_notifications) {
      await this.deliveryService.sendSmsNotification(dto.userId, dto.message);
    }

    return notification;
  }
}
