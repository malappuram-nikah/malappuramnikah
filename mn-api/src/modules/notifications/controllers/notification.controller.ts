import { Request, Response, NextFunction } from "express";
import { GetUserNotificationsUseCase } from "../application/use-cases/GetUserNotifications.usecase";
import { MarkAllNotificationsReadUseCase } from "../application/use-cases/MarkAllNotificationsRead.usecase";
import { MarkNotificationReadUseCase } from "../application/use-cases/MarkNotificationRead.usecase";
import { getUserIdFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError, BadRequestError } from "../../../shared/errors/AppError";

export class NotificationController {
  constructor(
    private getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private markNotificationReadUseCase: MarkNotificationReadUseCase
  ) {}

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const notifications = await this.getUserNotificationsUseCase.execute(userId);
      sendSuccess(res, { notifications }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      await this.markAllNotificationsReadUseCase.execute(userId);
      sendSuccess(res, undefined, "All notifications marked as read", 200);
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const notifId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      if (isNaN(notifId)) {
        throw new BadRequestError("Invalid notification ID");
      }

      const notification = await this.markNotificationReadUseCase.execute(notifId, userId);
      sendSuccess(res, { notification }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }
}
