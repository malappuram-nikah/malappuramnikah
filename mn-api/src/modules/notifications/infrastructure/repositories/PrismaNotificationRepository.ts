import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationEntity, NotificationPreferenceEntity } from "../../domain/entities/notification.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";
import prisma from "../../../../shared/database/prisma";

export class PrismaNotificationRepository implements INotificationRepository {
  async createNotification(userId: number, senderId: number, type: string, title: string, message: string): Promise<NotificationEntity> {
    const record = await prisma.notification.create({
      data: { user_id: userId, sender_id: senderId, type, title, message },
    });
    return record as unknown as NotificationEntity;
  }

  async getNotifications(userId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<NotificationEntity>> {
    const skip = (page - 1) * limit;
    const whereCondition = { user_id: userId };

    const [total, records] = await Promise.all([
      prisma.notification.count({ where: whereCondition }),
      prisma.notification.findMany({
        where: whereCondition,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: records as unknown as NotificationEntity[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const res = await prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
    return res.count > 0;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const res = await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return res.count;
  }

  async getPreferences(userId: number): Promise<NotificationPreferenceEntity | null> {
    const record = await prisma.notificationPreference.findUnique({
      where: { user_id: userId },
    });
    return record ? (record as unknown as NotificationPreferenceEntity) : null;
  }

  async upsertPreferences(userId: number, email: boolean, sms: boolean, push: boolean): Promise<NotificationPreferenceEntity> {
    const record = await prisma.notificationPreference.upsert({
      where: { user_id: userId },
      create: { user_id: userId, email_notifications: email, sms_notifications: sms, push_notifications: push },
      update: { email_notifications: email, sms_notifications: sms, push_notifications: push },
    });
    return record as unknown as NotificationPreferenceEntity;
  }
}
