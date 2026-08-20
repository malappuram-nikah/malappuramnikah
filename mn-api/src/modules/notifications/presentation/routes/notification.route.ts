import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.get("/", authenticateUser, NotificationController.getNotifications);
router.post("/create", authenticateUser, NotificationController.createNotification);
router.post("/read-all", authenticateUser, NotificationController.markAllAsRead);
router.post("/read/:id", authenticateUser, NotificationController.markAsRead);
router.get("/preferences", authenticateUser, NotificationController.getPreferences);
router.put("/preferences", authenticateUser, NotificationController.updatePreferences);

export default router;
