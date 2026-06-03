import { Router, Request, Response } from "express";
import prisma from "../../infrastructure/prisma/prisamClient";
import { getUserIdFromRequest } from "./interest.route";
import { io } from "../../index";

const chat_route = Router();

// Helper: Verify if two users have a mutual match (status: ACCEPTED)
async function verifyMutualMatch(userA: number, userB: number): Promise<boolean> {
  const match = await prisma.interest.findFirst({
    where: {
      OR: [
        { sender_id: userA, receiver_id: userB, status: "ACCEPTED" },
        { sender_id: userB, receiver_id: userA, status: "ACCEPTED" }
      ]
    }
  });
  return !!match;
}

// 1. Fetch Chat History (GET /user/chat/history/:peerId)
chat_route.get("/history/:peerId", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const peerId = parseInt(Array.isArray(req.params.peerId) ? req.params.peerId[0] : req.params.peerId, 10);
    if (isNaN(peerId)) {
      res.status(400).json({ success: false, message: "Invalid peer ID" });
      return;
    }

    // Security Check: Enforce mutual matchmaking rule!
    const isMatched = await verifyMutualMatch(userId, peerId);
    if (!isMatched) {
      res.status(403).json({
        success: false,
        message: "Chat locked. You must establish a mutual match to chat."
      });
      return;
    }

    // Fetch messages sorted chronologically
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId, receiver_id: peerId },
          { sender_id: peerId, receiver_id: userId }
        ]
      },
      orderBy: { created_at: "asc" }
    });

    // Mark messages from peer as read
    await prisma.message.updateMany({
      where: { sender_id: peerId, receiver_id: userId, is_read: false },
      data: { is_read: true }
    });

    res.status(200).json({ success: true, messages });
  } catch (err: any) {
    console.error("Error in fetch chat history:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// 2. Send Message (POST /user/chat/message)
chat_route.post("/message", async (req: Request, res: Response) => {
  try {
    const senderId = getUserIdFromRequest(req);
    if (!senderId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const receiverId = parseInt(req.body.receiver_id, 10);
    const content = req.body.content?.trim();

    if (isNaN(receiverId) || !content) {
      res.status(400).json({ success: false, message: "Invalid payload parameters" });
      return;
    }

    // Security Check: Enforce mutual matchmaking rule!
    const isMatched = await verifyMutualMatch(senderId, receiverId);
    if (!isMatched) {
      res.status(403).json({
        success: false,
        message: "Chat locked. You must establish a mutual match to send messages."
      });
      return;
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        content
      }
    });

    // Fetch sender name for real-time notification details
    const senderUser = await prisma.user.findUnique({
      where: { id: senderId },
      select: { first_name: true, last_name: true }
    });

    const senderName = senderUser ? `${senderUser.first_name} ${senderUser.last_name}` : "Someone";

    // 1. Emit socket message to receiver's personal room
    io.to(`user_${receiverId}`).emit("private_message", message);
    
    // 2. Emit socket message back to sender's personal room (for multi-device sync)
    io.to(`user_${senderId}`).emit("private_message", message);

    // 3. Trigger realtime socket notification alert
    io.to(`user_${receiverId}`).emit("notification", {
      type: "NEW_MESSAGE",
      title: `New Message from ${senderName}`,
      message: content.length > 40 ? `${content.substring(0, 37)}...` : content
    });

    // Create in-app notification in DB
    await prisma.notification.create({
      data: {
        user_id: receiverId,
        sender_id: senderId,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: `${senderName}: "${content.length > 50 ? content.substring(0, 47) + '...' : content}"`
      }
    });

    res.status(201).json({ success: true, message });
  } catch (err: any) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

export default chat_route;
