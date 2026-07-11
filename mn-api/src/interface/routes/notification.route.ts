import { Router, Request, Response } from "express";
import prisma from "../../infrastructure/prisma/prisamClient";
import { getUserIdFromRequest } from "./interest.route";

const notification_route = Router();

// 1. Fetch User Notifications (GET /user/notifications)
notification_route.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 40 // Limit to latest 40 notifications
    });

    // Populate sender profile info for visual display in frontend notifications dropdown
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        const sender = await prisma.user.findUnique({
          where: { id: notif.sender_id },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            gender: true,
            location: true,
            profile_details: true
          }
        });
        return {
          ...notif,
          sender
        };
      })
    );

    res.status(200).json({ success: true, notifications: enrichedNotifications });
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// 2. Mark All Notifications as Read (PUT /user/notifications/read-all)
notification_route.put("/read-all", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true }
    });

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    console.error("Error marking all read:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// 3. Mark Notification as Read (PUT /user/notifications/:id/read)
notification_route.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const notifId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(notifId)) {
      res.status(400).json({ success: false, message: "Invalid notification ID" });
      return;
    }

    // Verify ownership and update
    const notification = await prisma.notification.findFirst({
      where: { id: notifId, user_id: userId }
    });

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { is_read: true }
    });

    res.status(200).json({ success: true, notification: updated });
  } catch (err: any) {
    console.error("Error updating notification read state:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

export default notification_route;
