import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { GetUserNotificationsUseCase } from "../application/use-cases/GetUserNotifications.usecase";
import { MarkAllNotificationsReadUseCase } from "../application/use-cases/MarkAllNotificationsRead.usecase";
import { MarkNotificationReadUseCase } from "../application/use-cases/MarkNotificationRead.usecase";
import { PrismaNotificationRepository } from "../infrastructure/repositories/PrismaNotificationRepository";
import { memberAccountGuard } from "../../../shared/authorization/memberAccount.guard";

const notificationRouter = Router();
notificationRouter.use(memberAccountGuard);

const notificationRepository = new PrismaNotificationRepository();

const getUserNotificationsUseCase = new GetUserNotificationsUseCase(notificationRepository);
const markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepository);
const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationRepository);

const notificationController = new NotificationController(
  getUserNotificationsUseCase,
  markAllNotificationsReadUseCase,
  markNotificationReadUseCase
);

notificationRouter.get("/", (req, res, next) => notificationController.getNotifications(req, res, next));
notificationRouter.put("/read-all", (req, res, next) => notificationController.markAllRead(req, res, next));
notificationRouter.put("/:id/read", (req, res, next) => notificationController.markRead(req, res, next));

export default notificationRouter;
