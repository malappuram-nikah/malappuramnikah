import { INotificationRepository } from "../../domain/repositories/INotificationRepository";

export class MarkNotificationReadUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(notificationId: number, userId: number): Promise<{ success: boolean }> {
    const success = await this.notificationRepository.markAsRead(notificationId, userId);
    return { success };
  }
}
