import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationEntity } from "../../domain/entities/notification.entity";
import { prisma } from "../../../../infrastructure/database/prisma.service";

export class PrismaNotificationRepository implements INotificationRepository {
  async getNotifications(userId: number, limit = 40): Promise<NotificationEntity[]> {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    const enriched = await Promise.all(
      notifications.map(async (notif) => {
        const sender = await prisma.user.findUnique({
          where: { id: notif.sender_id },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            gender: true,
            location: true,
            profile_details: true,
          },
        });
        return {
          ...notif,
          sender,
        };
      })
    );

    return enriched as unknown as NotificationEntity[];
  }

  async markAllAsRead(userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  async markAsRead(id: number, userId: number): Promise<NotificationEntity | null> {
    const notification = await prisma.notification.findFirst({
      where: { id, user_id: userId },
    });

    if (!notification) return null;

    const updated = await prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });

    return updated as unknown as NotificationEntity;
  }
}
