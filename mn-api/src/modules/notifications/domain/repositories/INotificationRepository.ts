import { NotificationEntity, NotificationPreferenceEntity } from "../entities/notification.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export interface INotificationRepository {
  createNotification(userId: number, senderId: number, type: string, title: string, message: string): Promise<NotificationEntity>;
  getNotifications(userId: number, page?: number, limit?: number): Promise<PaginatedResult<NotificationEntity>>;
  markAsRead(notificationId: number, userId: number): Promise<boolean>;
  markAllAsRead(userId: number): Promise<number>;
  getPreferences(userId: number): Promise<NotificationPreferenceEntity | null>;
  upsertPreferences(userId: number, email: boolean, sms: boolean, push: boolean): Promise<NotificationPreferenceEntity>;
}
