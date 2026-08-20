import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationEntity } from "../../domain/entities/notification.entity";

export class GetUserNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: number): Promise<NotificationEntity[]> {
    return await this.notificationRepository.getNotifications(userId);
  }
}
