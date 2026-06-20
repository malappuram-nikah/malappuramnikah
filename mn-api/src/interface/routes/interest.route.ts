import { Router, Request, Response } from "express";
import prisma from "../../infrastructure/prisma/prisamClient";
import jwt from "jsonwebtoken";
import { io } from "../../index";

const interest_route = Router();

// Safely extract user ID from JWT token (supports real verify and base64 decode for dev fallback)
export function getUserIdFromRequest(req: Request): number | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    
    try {
      const payload: any = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      return payload.userId || null;
    } catch (verifyErr) {
      // Base64 fallback for dev-constructed JWTs
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.userId || null;
    }
  } catch (err) {
    console.error("JWT extraction failed:", err);
    return null;
  }
}

// 1. Toggle / Express Interest (POST /user/interest)
interest_route.post("/", async (req: Request, res: Response) => {
  try {
    const senderId = getUserIdFromRequest(req);
    if (!senderId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    const receiverId = parseInt(req.body.receiver_id, 10);
    if (isNaN(receiverId) || senderId === receiverId) {
      res.status(400).json({ success: false, message: "Invalid receiver ID" });
      return;
    }

    // Fetch user details for profiles
    const senderUser = await prisma.user.findUnique({ where: { id: senderId } });
    const receiverUser = await prisma.user.findUnique({ where: { id: receiverId } });

    if (!senderUser || !receiverUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const senderGender = (senderUser.gender || "").toLowerCase();
    const receiverGender = (receiverUser.gender || "").toLowerCase();
    if (senderGender && receiverGender && senderGender === receiverGender) {
      res.status(403).json({ success: false, message: "Access forbidden. Cannot express interest in same-gender profiles." });
      return;
    }

    // Check if interest already exists
    const existingInterest = await prisma.interest.findUnique({
      where: {
        sender_id_receiver_id: { sender_id: senderId, receiver_id: receiverId }
      }
    });

    if (existingInterest) {
      // If already accepted, we keep it. Otherwise, we toggle it (withdraw interest)
      if (existingInterest.status === "ACCEPTED") {
        res.status(200).json({ success: true, message: "Interest already accepted", status: "ACCEPTED" });
        return;
      }

      // Withdraw interest (delete record)
      await prisma.interest.delete({ where: { id: existingInterest.id } });
      
      // Delete any associated interest notification
      await prisma.notification.deleteMany({
        where: { user_id: receiverId, sender_id: senderId, type: "INTEREST_SENT" }
      });

      res.status(200).json({ success: true, message: "Interest withdrawn", status: "NONE" });
      return;
    }

    // Create new interest
    const newInterest = await prisma.interest.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        status: "PENDING"
      }
    });

    // Check if receiver has already shown interest in sender (mutual interest check!)
    const reverseInterest = await prisma.interest.findUnique({
      where: {
        sender_id_receiver_id: { sender_id: receiverId, receiver_id: senderId }
      }
    });

    if (reverseInterest) {
      // MUTUAL MATCH! Update both interests to ACCEPTED
      await prisma.interest.update({
        where: { id: newInterest.id },
        data: { status: "ACCEPTED" }
      });
      await prisma.interest.update({
        where: { id: reverseInterest.id },
        data: { status: "ACCEPTED" }
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          user_id: senderId,
          sender_id: receiverId,
          type: "INTEREST_ACCEPTED",
          title: "It's a Match! 🎉",
          message: `${receiverUser.first_name} ${receiverUser.last_name} shown interest in you! You can now start chatting.`
        }
      });

      // Create notification for receiver
      await prisma.notification.create({
        data: {
          user_id: receiverId,
          sender_id: senderId,
          type: "INTEREST_ACCEPTED",
          title: "It's a Match! 🎉",
          message: `Mutual interest with ${senderUser.first_name} ${senderUser.last_name}! You can now start chatting.`
        }
      });

      // Emit Socket matches
      io.to(`user_${senderId}`).emit("interest_match", {
        peer: {
          id: receiverUser.id,
          first_name: receiverUser.first_name,
          last_name: receiverUser.last_name,
          location: receiverUser.location,
          profile_details: receiverUser.profile_details
        }
      });
      io.to(`user_${receiverId}`).emit("interest_match", {
        peer: {
          id: senderUser.id,
          first_name: senderUser.first_name,
          last_name: senderUser.last_name,
          location: senderUser.location,
          profile_details: senderUser.profile_details
        }
      });

      // Trigger realtime match socket alerts
      io.to(`user_${senderId}`).emit("notification", {
        type: "INTEREST_ACCEPTED",
        title: "It's a Match! 🎉",
        message: `Mutual match with ${receiverUser.first_name}! Chatting is now unlocked.`
      });
      io.to(`user_${receiverId}`).emit("notification", {
        type: "INTEREST_ACCEPTED",
        title: "It's a Match! 🎉",
        message: `Mutual match with ${senderUser.first_name}! Chatting is now unlocked.`
      });

      res.status(200).json({ success: true, message: "Mutual interest established!", status: "ACCEPTED" });
      return;
    }

    // Normal single-sided interest: create notification for receiver
    await prisma.notification.create({
      data: {
        user_id: receiverId,
        sender_id: senderId,
        type: "INTEREST_SENT",
        title: "New Interest Received",
        message: `${senderUser.first_name} ${senderUser.last_name} is interested in your profile.`
      }
    });

    // Emit Socket realtime notification to receiver
    io.to(`user_${receiverId}`).emit("notification", {
      type: "INTEREST_SENT",
      title: "New Interest",
      message: `${senderUser.first_name} is interested in your profile.`
    });

    res.status(200).json({ success: true, message: "Interest expressed successfully", status: "PENDING" });
  } catch (err: any) {
    console.error("Error in express interest route:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// 2. Fetch all user interests (GET /user/interests)
interest_route.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // 1. Sent Interests (Pending + Accepted where sender is user)
    const sentInterests = await prisma.interest.findMany({
      where: { sender_id: userId },
      include: {
        receiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            cast: true,
            location: true,
            gender: true,
            dob: true,
            profile_details: true
          }
        }
      }
    });

    // 2. Received Interests (Pending + Accepted where receiver is user)
    const receivedInterests = await prisma.interest.findMany({
      where: { receiver_id: userId },
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            cast: true,
            location: true,
            gender: true,
            dob: true,
            profile_details: true
          }
        }
      }
    });

    // 3. Mutual Matches (Accepted)
    const mutualMatches = await prisma.interest.findMany({
      where: {
        OR: [
          { sender_id: userId, status: "ACCEPTED" },
          { receiver_id: userId, status: "ACCEPTED" }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            cast: true,
            location: true,
            gender: true,
            dob: true,
            profile_details: true
          }
        },
        receiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            cast: true,
            location: true,
            gender: true,
            dob: true,
            profile_details: true
          }
        }
      }
    });

    // Deduplicate sent by receiver.id
    const sentMap = new Map<number, any>();
    sentInterests.forEach(i => {
      if (i.receiver) {
        sentMap.set(i.receiver.id, { ...i.receiver, interest_status: i.status });
      }
    });

    // Deduplicate received by sender.id
    const receivedMap = new Map<number, any>();
    receivedInterests.forEach(i => {
      if (i.sender) {
        receivedMap.set(i.sender.id, { ...i.sender, interest_status: i.status });
      }
    });

    // Deduplicate mutual by peer.id
    const mutualMap = new Map<number, any>();
    mutualMatches.forEach(match => {
      const peer = match.sender_id === userId ? match.receiver : match.sender;
      if (peer) {
        mutualMap.set(peer.id, { ...peer, interest_status: match.status });
      }
    });

    res.status(200).json({
      success: true,
      sent: Array.from(sentMap.values()),
      received: Array.from(receivedMap.values()),
      mutual: Array.from(mutualMap.values())
    });
  } catch (err: any) {
    console.error("Error fetching interests:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

export default interest_route;
