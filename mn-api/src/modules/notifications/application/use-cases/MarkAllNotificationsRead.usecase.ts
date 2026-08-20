import { INotificationRepository } from "../../domain/repositories/INotificationRepository";

export class MarkAllNotificationsReadUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: number): Promise<{ count: number }> {
    const count = await this.notificationRepository.markAllAsRead(userId);
    return { count };
  }
}
