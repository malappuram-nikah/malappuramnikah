import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationPreferenceEntity } from "../../domain/entities/notification.entity";

export interface UpdatePreferencesDto {
  userId: number;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
}

export class UpdateNotificationPreferencesUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(dto: UpdatePreferencesDto): Promise<NotificationPreferenceEntity> {
    const existing = await this.notificationRepository.getPreferences(dto.userId);

    const email = dto.emailNotifications ?? existing?.email_notifications ?? true;
    const sms = dto.smsNotifications ?? existing?.sms_notifications ?? true;
    const push = dto.pushNotifications ?? existing?.push_notifications ?? true;

    return await this.notificationRepository.upsertPreferences(dto.userId, email, sms, push);
  }
}
