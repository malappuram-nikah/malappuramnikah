import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationPreferenceEntity } from "../../domain/entities/notification.entity";

export class GetNotificationPreferencesUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: number): Promise<NotificationPreferenceEntity> {
    const preferences = await this.notificationRepository.getPreferences(userId);
    if (!preferences) {
      return await this.notificationRepository.upsertPreferences(userId, true, true, true);
    }
    return preferences;
  }
}
