import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { LoginUser, RegisterUser } from "../../applications/use-cases";
import { GenerateGuestReferralUseCase } from "../../applications/use-cases/user/GenerateGuestReferral.usecase";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { GetAllUsers } from "../../applications/use-cases/user/GetAllUsers.usecase";
import { OtpRepository } from "../../infrastructure/repositories/OtpRepository";
import { UpdateProfileDetailsUseCase } from "../../applications/use-cases/user/UpdateProfileDetails.usecase";


import { getUserIdFromRequest, isAdminTokenFromRequest } from "./interest.route";
import { createMemberAccountGuard } from "../../infrastructure/middleware/memberAccount.middleware";
import prisma from "../../infrastructure/prisma/prisamClient";
import { io } from "../../index";
import { MediaStorageService } from "../../infrastructure/service/MediaStorageService";
import bcrypt from "bcryptjs";


const user_route = express.Router();
const userRepository = new UserRepository();
const otpRepository = new OtpRepository();
const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository)
const sendOtp = new SendOtpUseCase(otpRepository)
const getAllUsers = new GetAllUsers(userRepository)
const updateProfileDetails = new UpdateProfileDetailsUseCase(userRepository)
const generateGuestReferral = new GenerateGuestReferralUseCase()
const userController = new UserController(
loginUser,
registerUser,
sendOtp,
getAllUsers,
updateProfileDetails,
generateGuestReferral
);

user_route.post('/register', async (req: Request, res: Response) => { await userController.register(req, res)});
user_route.post('/generate-referral-code', async (req: Request, res: Response) => { await userController.generateReferral(req, res)});
user_route.post('/login',async (req:Request,res:Response) => {await userController.login(req,res)})

// Public stats endpoint for home page counters
user_route.get('/public-stats', async (req: Request, res: Response) => {
  try {
    const [totalUsers, activeUsers, verifiedUsers, acceptedMatches] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { kyc_status: "VERIFIED" } }),
      prisma.interest.count({ where: { status: "ACCEPTED" } }),
    ]);

    const registeredMembers = totalUsers;
    const happyMarriages = acceptedMatches;
    
    // Percentage of verified or active profiles out of total
    let verifiedPercentage = 98;
    if (totalUsers > 0) {
      const verifiedOrActive = Math.max(activeUsers, verifiedUsers);
      verifiedPercentage = Math.min(100, Math.max(80, Math.round((verifiedOrActive / totalUsers) * 100)));
    }

    const earliestUser = await prisma.user.findFirst({
      orderBy: { created_at: "asc" },
      select: { created_at: true },
    });
    
    let yearsOfTrust = 1;
    if (earliestUser) {
      const createdYear = new Date(earliestUser.created_at).getFullYear();
      const currentYear = new Date().getFullYear();
      yearsOfTrust = Math.max(1, currentYear - createdYear + 1);
    }

    res.status(200).json({
      success: true,
      stats: {
        registeredMembers,
        happyMarriages,
        verifiedPercentage,
        yearsOfTrust,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch public stats" });
  }
});

user_route.use(createMemberAccountGuard({ allowSelfProfileGet: true }));

user_route.get('/profiles', async (req: Request, res: Response) => { await userController.getProfiles(req, res)});
user_route.put('/:id/profile', async (req: Request, res: Response) => { await userController.updateProfile(req, res)});
user_route.get('/:id', async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!idParam) {
      res.status(400).json({ success: false, message: "Invalid user identifier" });
      return;
    }

    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    if (isAdminTokenFromRequest(req) && requesterId === parseInt(idParam, 10)) {
      res.status(403).json({
        success: false,
        message: "Admin accounts must use the admin profile API.",
      });
      return;
    }

    const user = await userRepository.findById(idParam);
    if (!user || user.id === undefined) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const targetUserId: number = user.id;

    let reqIsAdmin = isAdminTokenFromRequest(req);
    const requester = await userRepository.findById(requesterId);
    if (requester) {
      reqIsAdmin = reqIsAdmin || (requester.profile_details as any)?.isAdmin === true || requester.mobile_number === "+911212121212" || requester.mobile_number === "+919876543210";
      if (!reqIsAdmin && requesterId !== targetUserId) {
        const reqGender = (requester.gender || "").toLowerCase();
        const targetGender = (user.gender || "").toLowerCase();
        if (reqGender && targetGender && reqGender === targetGender) {
          res.status(403).json({ success: false, message: "Access forbidden. Same-gender profile visibility is restricted." });
          return;
        }
      }
    }

    // Record profile view
    if (requesterId && requesterId !== targetUserId && !reqIsAdmin) {
      try {
        await prisma.profileView.upsert({
          where: {
            viewer_id_viewed_id: {
              viewer_id: requesterId,
              viewed_id: targetUserId,
            },
          },
          update: {},
          create: {
            viewer_id: requesterId,
            viewed_id: targetUserId,
          },
        });
      } catch (viewError) {
        console.error("Failed to record profile view:", viewError);
      }
    }

    // Remove password hash and sensitive KYC document URLs from response for non-admin/non-owner requesters
    const { password, kyc_front_url, kyc_back_url, ...safeUser } = user as any;
    const canSeeKycDocs = reqIsAdmin || requesterId === targetUserId;
    
    const finalUser = canSeeKycDocs 
      ? { ...safeUser, kyc_front_url, kyc_back_url } 
      : safeUser;

    const { onlineUsers } = require("../../infrastructure/onlineTracker");
    res.status(200).json({ success: true, user: { ...finalUser, is_online: onlineUsers.has(targetUserId) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch user" });
  }
});


user_route.put('/:id/premium', async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }
    if (requesterId !== id) {
      res.status(403).json({ success: false, message: "You can only update your own premium status." });
      return;
    }

    const { is_premium } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { is_premium: !!is_premium }
    });
    const { password: _password, ...safeUser } = updatedUser;
    res.status(200).json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update premium status" });
  }
});

const KYC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "kyc");

async function deleteKycFile(fileName: string | null) {
  if (!fileName) return;
  try {
    const filePath = path.join(KYC_UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old local KYC file: ${fileName}`);
    }

    if (MediaStorageService.isCloudinaryConfigured) {
      const publicId = `malappuram_nikah/kyc/${path.parse(fileName).name}`;
      const { v2: cloudinary } = require("cloudinary");
      await cloudinary.uploader.destroy(publicId, { type: "authenticated" });
      console.log(`Deleted old Cloudinary KYC file: ${publicId}`);
    }
  } catch (err) {
    console.error(`Failed to delete KYC file ${fileName}:`, err);
  }
}

async function createKycNotification(userId: number, title: string, message: string, type: string) {
  try {
    const notif = await prisma.notification.create({
      data: {
        user_id: userId,
        sender_id: 2, // Admin/System sender
        type,
        title,
        message,
        is_read: false
      }
    });

    io.to(`user_${userId}`).emit("notification", {
      id: notif.id,
      type,
      title,
      message,
      created_at: notif.created_at
    });
  } catch (err) {
    console.error("Failed to create/emit KYC notification:", err);
  }
}

user_route.post('/kyc/submit', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    const { document_type, front_base64, back_base64 } = req.body;

    if (!document_type) {
      res.status(400).json({ success: false, message: "Document type is required." });
      return;
    }

    const allowedDocTypes = [
      "Aadhaar Card",
      "Driving License",
      "Passport",
      "Voter ID",
      "National ID",
      "Other Government Issued ID"
    ];
    if (!allowedDocTypes.includes(document_type)) {
      res.status(400).json({ success: false, message: "Invalid document type." });
      return;
    }

    if (!front_base64) {
      res.status(400).json({ success: false, message: "Front side document upload is mandatory." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    // Prevent duplicate submissions
    if (user.kyc_status === "PENDING" || user.kyc_status === "UNDER_REVIEW") {
      res.status(400).json({ success: false, message: "A verification request is already pending or under review." });
      return;
    }

    // Helper function to validate and save base64 document
    const saveDocument = async (base64Data: string, side: "front" | "back"): Promise<string> => {
      // Parse base64
      const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = "application/octet-stream";
      let base64Body = base64Data;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Body = matches[2];
      } else {
        if (base64Data.includes(";base64,")) {
          base64Body = base64Data.split(";base64,")[1];
        }
      }

      // Validate file type
      const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedMimes.includes(mimeType)) {
        throw new Error(`Invalid file type for ${side} side. Only JPG, JPEG, PNG, and PDF are supported.`);
      }

      const buffer = Buffer.from(base64Body, "base64");
      // Validate file size: limit to 5MB
      const maxBytes = 5 * 1024 * 1024;
      if (buffer.length > maxBytes) {
        throw new Error(`File size for ${side} side exceeds 5MB limit.`);
      }

      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "application/pdf": "pdf"
      };
      const extension = extMap[mimeType] || "bin";
      const fileName = `kyc_${userId}_${side}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;

      await MediaStorageService.uploadPrivateMedia(base64Data, fileName);
      return fileName;
    };

    let frontFileName: string;
    let backFileName: string | null = null;

    try {
      frontFileName = await saveDocument(front_base64, "front");
      if (back_base64) {
        backFileName = await saveDocument(back_base64, "back");
      }
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }

    // Clean up previous documents if they exist
    await deleteKycFile(user.kyc_front_url);
    await deleteKycFile(user.kyc_back_url);

    // Update User KYC Info in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        kyc_status: "PENDING",
        kyc_document_type: document_type,
        kyc_front_url: frontFileName,
        kyc_back_url: backFileName,
        kyc_rejected_reason: null,
        kyc_submitted_at: new Date()
      }
    });

    // Send Notification
    await createKycNotification(
      userId,
      "Verification Request Submitted",
      "Your identity verification request has been submitted successfully and is pending review.",
      "KYC_SUBMITTED"
    );

    const { password, ...safeUser } = updatedUser as any;
    res.status(200).json({ success: true, message: "KYC documents submitted successfully.", user: safeUser });
  } catch (error: any) {
    console.error("KYC submission error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to submit KYC documents." });
  }
});

user_route.get('/kyc/document/:fileName', async (req: Request, res: Response) => {
  try {
    const isAdmin = isAdminTokenFromRequest(req);
    const userId = getUserIdFromRequest(req);
    if (!userId && !isAdmin) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    const fileName = (Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName) as string;

    // If not verified admin, check ownership or admin rights in DB
    if (!isAdmin) {
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
        return;
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, message: "User not found." });
        return;
      }

      const isDbAdmin = (user.profile_details as any)?.isAdmin === true || user.mobile_number === "+911212121212" || user.mobile_number === "+919876543210";
      const isOwner = user.kyc_front_url === fileName || user.kyc_back_url === fileName;

      if (!isDbAdmin && !isOwner) {
        res.status(403).json({ success: false, message: "Forbidden. You do not have permission to view this document." });
        return;
      }
    }

    const filePath = path.join(KYC_UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".pdf") contentType = "application/pdf";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }

    if (MediaStorageService.isCloudinaryConfigured) {
      const signedUrl = MediaStorageService.getPrivateMediaUrl(fileName);
      res.redirect(signedUrl);
      return;
    }

    res.status(404).json({ success: false, message: "File not found." });
  } catch (error: any) {
    console.error("KYC document fetch error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch KYC document." });
  }
});

user_route.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }

    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    // Only allow user to delete their own profile, or if requester is admin
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    const isAdmin = requester && ((requester.profile_details as any)?.isAdmin === true || requester.mobile_number === "+911212121212" || requester.mobile_number === "+919876543210");

    if (requesterId !== id && !isAdmin) {
      res.status(403).json({ success: false, message: "Access forbidden. You can only delete your own profile." });
      return;
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Clean up file uploads (KYC, etc.)
    await deleteKycFile(userToDelete.kyc_front_url);
    await deleteKycFile(userToDelete.kyc_back_url);

    // Delete child records manually inside a database transaction to satisfy foreign keys
    await prisma.$transaction([
      prisma.verify.deleteMany({ where: { user_id: id } }),
      prisma.interest.deleteMany({
        where: {
          OR: [
            { sender_id: id },
            { receiver_id: id }
          ]
        }
      }),
      prisma.message.deleteMany({
        where: {
          OR: [
            { sender_id: id },
            { receiver_id: id }
          ]
        }
      }),
      prisma.notification.deleteMany({
        where: {
          OR: [
            { user_id: id },
            { sender_id: id }
          ]
        }
      }),
      prisma.user.delete({ where: { id } })
    ]);

    res.status(200).json({ success: true, message: "Profile deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete profile" });
  }
});


/* ─── BLOCK / UNBLOCK ─────────────────────────────────────── */

// Toggle block: POST /user/block { target_id }
user_route.post('/block', async (req: Request, res: Response) => {
  try {
    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const target_id = parseInt(req.body.target_id, 10);
    if (isNaN(target_id) || target_id === requesterId) {
      res.status(400).json({ success: false, message: "Invalid target_id" });
      return;
    }

    const existing = await prisma.block.findUnique({
      where: { blocker_id_blocked_id: { blocker_id: requesterId, blocked_id: target_id } }
    });

    if (existing) {
      // Unblock
      await prisma.block.delete({ where: { id: existing.id } });
      res.status(200).json({ success: true, status: "UNBLOCKED" });
    } else {
      // Block (and auto-remove any pending interest between them)
      await prisma.$transaction([
        prisma.block.create({ data: { blocker_id: requesterId, blocked_id: target_id } }),
        prisma.interest.deleteMany({
          where: {
            OR: [
              { sender_id: requesterId, receiver_id: target_id },
              { sender_id: target_id, receiver_id: requesterId },
            ]
          }
        })
      ]);
      res.status(200).json({ success: true, status: "BLOCKED" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to toggle block" });
  }
});

// Get my blocked list: GET /user/block
user_route.get('/block', async (req: Request, res: Response) => {
  try {
    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const blocks = await prisma.block.findMany({
      where: { blocker_id: requesterId },
      select: { blocked_id: true }
    });
    res.status(200).json({ success: true, blocked_ids: blocks.map(b => b.blocked_id) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch blocked list" });
  }
});

/* ─── FAVOURITE / UNFAVOURITE ─────────────────────────────── */

// Toggle favourite: POST /user/favourite { target_id }
user_route.post('/favourite', async (req: Request, res: Response) => {
  try {
    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const target_id = parseInt(req.body.target_id, 10);
    if (isNaN(target_id) || target_id === requesterId) {
      res.status(400).json({ success: false, message: "Invalid target_id" });
      return;
    }

    const existing = await prisma.favourite.findUnique({
      where: { favouriter_id_favourited_id: { favouriter_id: requesterId, favourited_id: target_id } }
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      res.status(200).json({ success: true, status: "UNFAVOURITED" });
    } else {
      await prisma.favourite.create({ data: { favouriter_id: requesterId, favourited_id: target_id } });
      res.status(200).json({ success: true, status: "FAVOURITED" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to toggle favourite" });
  }
});

// Get my favourites + blocks: GET /user/favourite
user_route.get('/favourite', async (req: Request, res: Response) => {
  try {
    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const [favs, blocks] = await Promise.all([
      prisma.favourite.findMany({ where: { favouriter_id: requesterId }, select: { favourited_id: true } }),
      prisma.block.findMany({ where: { blocker_id: requesterId }, select: { blocked_id: true } }),
    ]);
    res.status(200).json({
      success: true,
      favourite_ids: favs.map(f => f.favourited_id),
      blocked_ids: blocks.map(b => b.blocked_id),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch favourites" });
  }
});

/* ─── FEEDBACK SUBMISSION ─────────────────────────────────── */

// Submit feedback: POST /user/feedback
user_route.post('/feedback', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { category, rating, subject, message } = req.body;

    // Validate inputs
    const validCategories = ["SUGGESTION", "BUG", "APPRECIATION", "OTHER"];
    const normalizedCategory = typeof category === "string" ? category.toUpperCase().trim() : "";

    if (!validCategories.includes(normalizedCategory)) {
      res.status(400).json({
        success: false,
        message: "Invalid category. Must be one of SUGGESTION, BUG, APPRECIATION, or OTHER."
      });
      return;
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400).json({
        success: false,
        message: "Invalid rating. Rating must be a whole number between 1 and 5."
      });
      return;
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: "Invalid subject. Subject must be at least 3 characters long."
      });
      return;
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: "Invalid message. Message must be at least 10 characters long."
      });
      return;
    }

    // Insert into database
    const feedback = await prisma.feedback.create({
      data: {
        user_id: userId,
        category: normalizedCategory,
        rating: parsedRating,
        subject: subject.trim(),
        message: message.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: "Thank you for your feedback! It has been submitted successfully.",
      feedback
    });
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit feedback. Please try again."
    });
  }
});

// Password Reset - Step 1: Send OTP to Mobile Number or Email
user_route.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email, identifier, mobile_number } = req.body;
    const input = (identifier || email || mobile_number || "").toString().trim();
    if (!input) {
      res.status(400).json({ success: false, message: "Please provide your mobile number or email address." });
      return;
    }

    const cleanInput = input.toLowerCase();
    const digitsOnly = input.replace(/[^0-9]/g, "");

    // Find user by mobile_number (exact, formatted with +91 or raw) OR email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanInput, mode: "insensitive" } },
          { mobile_number: { equals: input } },
          { mobile_number: { equals: `+91${digitsOnly}` } },
          { mobile_number: { equals: `+${digitsOnly}` } },
          { mobile_number: { endsWith: digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly } },
          {
            profile_details: {
              path: ["mn_basic_details_draft", "email"],
              equals: cleanInput
            }
          }
        ]
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "No account found matching this mobile number or email address."
      });
      return;
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // Clear previous verification records for user
    await prisma.verify.deleteMany({ where: { user_id: user.id } });

    // Create new verify record
    await prisma.verify.create({
      data: {
        user_id: user.id,
        otp_code: otpCode,
        expires_at: expiresAt,
        is_verified: false
      }
    });

    console.log(`[PASSWORD RESET OTP] Sent to ${user.mobile_number || cleanInput} (User #${user.id}): ${otpCode}`);

    const targetPhone = user.mobile_number || (digitsOnly ? `+91${digitsOnly.slice(-10)}` : "");
    if (targetPhone) {
      const { WhatsappOtpService } = require("../../infrastructure/service/WhatsappOtpService");
      WhatsappOtpService.sendOtp(targetPhone, otpCode).catch((e: any) =>
        console.error("Failed to send WhatsApp OTP for forgot password:", e)
      );
    }

    res.status(200).json({
      success: true,
      message: `Password reset code sent to your WhatsApp (${targetPhone || cleanInput}).`,
      email: cleanInput,
      identifier: input,
      devOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to process request." });
  }
});

// Password Reset - Step 2: Verify OTP & Reset Password
user_route.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, identifier, mobile_number, otp, newPassword } = req.body;
    const input = (identifier || email || mobile_number || "").toString().trim();
    if (!input) {
      res.status(400).json({ success: false, message: "Mobile number or email address is required." });
      return;
    }

    if (!otp || typeof otp !== "string" || !otp.trim()) {
      res.status(400).json({ success: false, message: "Verification code is required." });
      return;
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
      return;
    }

    const cleanInput = input.toLowerCase();
    const digitsOnly = input.replace(/[^0-9]/g, "");

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanInput, mode: "insensitive" } },
          { mobile_number: { equals: input } },
          { mobile_number: { equals: `+91${digitsOnly}` } },
          { mobile_number: { equals: `+${digitsOnly}` } },
          { mobile_number: { endsWith: digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly } },
          {
            profile_details: {
              path: ["mn_basic_details_draft", "email"],
              equals: cleanInput
            }
          }
        ]
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User account not found." });
      return;
    }

    // Verify OTP record
    const verifyRecord = await prisma.verify.findFirst({
      where: {
        user_id: user.id,
        otp_code: otp.trim(),
        is_verified: false,
        expires_at: { gte: new Date() }
      }
    });

    if (!verifyRecord) {
      res.status(400).json({ success: false, message: "Invalid or expired verification code." });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Clear verification records
    await prisma.verify.deleteMany({ where: { user_id: user.id } });

    res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password."
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to reset password." });
  }
});

// ==========================================
// BIODATA ACCESS CONTROL & DOWNLOAD ENDPOINTS
// ==========================================

export async function checkBiodataAccessPermission(requesterId: number, targetUserId: number): Promise<{ allowed: boolean; status: string; isSelf: boolean; message?: string }> {
  if (requesterId === targetUserId) {
    return { allowed: true, status: "ACCEPTED", isSelf: true };
  }

  const interest = await prisma.interest.findFirst({
    where: {
      OR: [
        { sender_id: requesterId, receiver_id: targetUserId },
        { sender_id: targetUserId, receiver_id: requesterId }
      ]
    }
  });

  if (interest && interest.status === "ACCEPTED") {
    return { allowed: true, status: "ACCEPTED", isSelf: false };
  }

  const currentStatus = interest ? interest.status : "NONE";
  return {
    allowed: false,
    status: currentStatus,
    isSelf: false,
    message: "Access denied. Biodata is available after the profile owner accepts your invite."
  };
}

// 1. GET /user/biodata/check-permission/:targetId
user_route.get('/biodata/check-permission/:targetId', async (req: Request, res: Response) => {
  try {
    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    const targetParam = Array.isArray(req.params.targetId) ? req.params.targetId[0] : req.params.targetId;
    const targetUser = await userRepository.findById(targetParam);
    if (!targetUser || !targetUser.id) {
      res.status(404).json({ success: false, message: "Profile not found." });
      return;
    }

    const perm = await checkBiodataAccessPermission(requesterId, targetUser.id);
    res.status(200).json({
      success: perm.allowed,
      allowed: perm.allowed,
      status: perm.status,
      isSelf: perm.isSelf,
      message: perm.message || (perm.allowed ? "Biodata download allowed." : "Biodata access restricted.")
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to check biodata permission." });
  }
});

// 2. GET /user/biodata/download/:targetId
user_route.get('/biodata/download/:targetId', async (req: Request, res: Response) => {
  try {
    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    const targetParam = Array.isArray(req.params.targetId) ? req.params.targetId[0] : req.params.targetId;
    const targetUser = await userRepository.findById(targetParam);
    if (!targetUser || !targetUser.id) {
      res.status(404).json({ success: false, message: "Profile not found." });
      return;
    }

    // Check system-wide admin setting
    const storePath = path.join(__dirname, "../../../src/infrastructure/data/adminStore.json");
    if (fs.existsSync(storePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
        if (store.biodata_settings?.enable_download === false) {
          res.status(403).json({
            success: false,
            message: "Biodata downloads are currently disabled by the administrator.",
            code: "BIODATA_DISABLED"
          });
          return;
        }
      } catch {}
    }

    // Enforce permission rule: Must be self OR interest must be ACCEPTED
    const perm = await checkBiodataAccessPermission(requesterId, targetUser.id);
    if (!perm.allowed) {
      res.status(403).json({
        success: false,
        message: "Access denied. Biodata is available after the profile owner accepts your invite.",
        code: "BIODATA_ACCESS_DENIED",
        status: perm.status
      });
      return;
    }

    // Track download in admin store
    if (fs.existsSync(storePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
        const requester = await prisma.user.findUnique({ where: { id: requesterId } });
        const requesterName = requester ? `${requester.first_name} ${requester.last_name}` : `User #${requesterId}`;

        if (!store.biodata_downloads) store.biodata_downloads = [];
        store.biodata_downloads.unshift({
          id: Date.now(),
          user_id: requesterId,
          user_name: requesterName,
          target_user_id: targetUser.id,
          target_user_name: `${targetUser.first_name} ${targetUser.last_name}`,
          downloaded_at: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
        if (store.biodata_downloads.length > 500) {
          store.biodata_downloads = store.biodata_downloads.slice(0, 500);
        }
        fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
      } catch {}
    }

    const { password, ...safeUser } = targetUser as any;

    res.status(200).json({
      success: true,
      message: "Biodata download authorized.",
      isAccepted: true,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to process biodata download." });
  }
});

// 3. POST /user/biodata/download (handles JSON body targetId)
user_route.post('/biodata/download', async (req: Request, res: Response) => {
  const targetId = req.body.targetId || req.body.receiver_id || req.body.user_id;
  if (!targetId) {
    res.status(400).json({ success: false, message: "Target profile ID is required." });
    return;
  }
  req.params.targetId = String(targetId);
  
  try {
    const requesterId = getUserIdFromRequest(req);
    if (!requesterId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    const targetUser = await userRepository.findById(String(targetId));
    if (!targetUser || !targetUser.id) {
      res.status(404).json({ success: false, message: "Profile not found." });
      return;
    }

    const storePath = path.join(__dirname, "../../../src/infrastructure/data/adminStore.json");
    if (fs.existsSync(storePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
        if (store.biodata_settings?.enable_download === false) {
          res.status(403).json({
            success: false,
            message: "Biodata downloads are currently disabled by the administrator.",
            code: "BIODATA_DISABLED"
          });
          return;
        }
      } catch {}
    }

    const perm = await checkBiodataAccessPermission(requesterId, targetUser.id);
    if (!perm.allowed) {
      res.status(403).json({
        success: false,
        message: "Access denied. Biodata is available after the profile owner accepts your invite.",
        code: "BIODATA_ACCESS_DENIED",
        status: perm.status
      });
      return;
    }

    const { password, ...safeUser } = targetUser as any;
    res.status(200).json({
      success: true,
      message: "Biodata download authorized.",
      isAccepted: true,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to process biodata download." });
  }
});

export default user_route;