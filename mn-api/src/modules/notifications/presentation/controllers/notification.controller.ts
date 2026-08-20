import { Request, Response, NextFunction } from "express";
import { CreateNotificationUseCase } from "../../application/use-cases/CreateNotification.usecase";
import { GetNotificationsUseCase } from "../../application/use-cases/GetNotifications.usecase";
import { MarkNotificationReadUseCase } from "../../application/use-cases/MarkNotificationRead.usecase";
import { MarkAllNotificationsReadUseCase } from "../../application/use-cases/MarkAllNotificationsRead.usecase";
import { UpdateNotificationPreferencesUseCase } from "../../application/use-cases/UpdateNotificationPreferences.usecase";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/GetNotificationPreferences.usecase";

import { PrismaNotificationRepository } from "../../infrastructure/repositories/PrismaNotificationRepository";
import { DefaultNotificationDeliveryService } from "../../../../shared/notifications/INotificationDeliveryService";
import { sendSuccess } from "../../../../shared/utils/response.util";
import { BadRequestError } from "../../../../shared/errors/AppError";

const notificationRepo = new PrismaNotificationRepository();
const deliveryService = new DefaultNotificationDeliveryService();

const createNotificationUseCase = new CreateNotificationUseCase(notificationRepo, deliveryService);
const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepo);
const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationRepo);
const markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepo);
const updateNotificationPreferencesUseCase = new UpdateNotificationPreferencesUseCase(notificationRepo);
const getNotificationPreferencesUseCase = new GetNotificationPreferencesUseCase(notificationRepo);

export class NotificationController {
  static async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = (req as any).user?.userId || 0;
      const { user_id, userId, type, title, message } = req.body;
      const targetUserId = parseInt(user_id || userId, 10);

      if (isNaN(targetUserId)) {
        throw new BadRequestError("Valid target user_id is required.");
      }

      const notification = await createNotificationUseCase.execute({
        userId: targetUserId,
        senderId,
        type: type || "GENERAL",
        title: title || "Notification",
        message,
      });

      sendSuccess(res, notification, "Notification created successfully.", 201);
    } catch (err) {
      next(err);
    }
  }

  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await getNotificationsUseCase.execute(userId, page, limit);
      sendSuccess(res, result, "Notifications retrieved successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        throw new BadRequestError("Valid notification ID is required.");
      }

      const result = await markNotificationReadUseCase.execute(id, userId);
      sendSuccess(res, result, "Notification marked as read.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await markAllNotificationsReadUseCase.execute(userId);
      sendSuccess(res, result, "All notifications marked as read.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const preferences = await getNotificationPreferencesUseCase.execute(userId);
      sendSuccess(res, preferences, "Notification preferences retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { emailNotifications, smsNotifications, pushNotifications } = req.body;

      const preferences = await updateNotificationPreferencesUseCase.execute({
        userId,
        emailNotifications,
        smsNotifications,
        pushNotifications,
      });

      sendSuccess(res, preferences, "Notification preferences updated.", 200);
    } catch (err) {
      next(err);
    }
  }
}
