import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.post("/send", authenticateUser, ChatController.sendMessage);
router.get("/conversations", authenticateUser, ChatController.getConversations);
router.get("/messages/:targetUserId", authenticateUser, ChatController.getMessages);
router.post("/read/:targetUserId", authenticateUser, ChatController.markAsRead);
router.get("/unread-count", authenticateUser, ChatController.getUnreadCount);

export default router;
