import { INotificationRepository } from "../../domain/repositories/INotificationRepository";

export class MarkAllNotificationsReadUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: number): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
