import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationEntity } from "../../domain/entities/notification.entity";

export class GetUserNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: number): Promise<NotificationEntity[]> {
    const result = await this.notificationRepository.getNotifications(userId);
    return result.data;
  }
}
