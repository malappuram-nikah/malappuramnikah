import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationEntity } from "../../domain/entities/notification.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export class GetNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<NotificationEntity>> {
    return await this.notificationRepository.getNotifications(userId, page, limit);
  }
}
