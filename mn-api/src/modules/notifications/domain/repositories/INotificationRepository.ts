import { NotificationEntity } from "../entities/notification.entity";

export interface INotificationRepository {
  getNotifications(userId: number, limit?: number): Promise<NotificationEntity[]>;
  markAllAsRead(userId: number): Promise<void>;
  markAsRead(id: number, userId: number): Promise<NotificationEntity | null>;
}
