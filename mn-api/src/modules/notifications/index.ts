import notificationRoutes from "./presentation/routes/notification.route";

export { notificationRoutes, notificationRoutes as notificationRouter };
export * from "./presentation/controllers/notification.controller";
export * from "./application/use-cases/CreateNotification.usecase";
export * from "./application/use-cases/GetNotifications.usecase";
export * from "./application/use-cases/MarkNotificationRead.usecase";
export * from "./application/use-cases/MarkAllNotificationsRead.usecase";
export * from "./application/use-cases/UpdateNotificationPreferences.usecase";
export * from "./application/use-cases/GetNotificationPreferences.usecase";
