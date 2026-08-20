import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationEntity } from "../../domain/entities/notification.entity";
import { NotFoundError, BadRequestError } from "../../../../shared/errors/AppError";

export class MarkNotificationReadUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(notifId: number, userId: number): Promise<NotificationEntity> {
    if (isNaN(notifId)) {
      throw new BadRequestError("Invalid notification ID");
    }

    const updated = await this.notificationRepository.markAsRead(notifId, userId);
    if (!updated) {
      throw new NotFoundError("Notification not found");
    }

    return updated;
  }
}
