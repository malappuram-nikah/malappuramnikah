import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { LoginUser, RegisterUser } from "../../applications/use-cases";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { GetAllUsers } from "../../applications/use-cases/user/GetAllUsers.usecase";
import { OtpRepository } from "../../infrastructure/repositories/OtpRepository";
import { UpdateProfileDetailsUseCase } from "../../applications/use-cases/user/UpdateProfileDetails.usecase";


import { getUserIdFromRequest } from "./interest.route";
import prisma from "../../infrastructure/prisma/prisamClient";
import { io } from "../../index";
import { MediaStorageService } from "../../infrastructure/service/MediaStorageService";


const user_route = express.Router();
const userRepository = new UserRepository();
const otpRepository = new OtpRepository();
const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository)
const sendOtp = new SendOtpUseCase(otpRepository)
const getAllUsers = new GetAllUsers(userRepository)
const updateProfileDetails = new UpdateProfileDetailsUseCase(userRepository)
const userController = new UserController(
loginUser,
registerUser,
sendOtp,
getAllUsers,
updateProfileDetails
);

user_route.post('/register', async (req: Request, res: Response) => { await userController.register(req, res)});
user_route.post('/login',async (req:Request,res:Response) => {await userController.login(req,res)})
user_route.get('/profiles', async (req: Request, res: Response) => { await userController.getProfiles(req, res)});
user_route.put('/:id/profile', async (req: Request, res: Response) => { await userController.updateProfile(req, res)});
user_route.get('/:id', async (req: Request, res: Response) => {
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

    const user = await userRepository.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const requester = await userRepository.findById(requesterId);
    if (requester) {
      const reqIsAdmin = (requester.profile_details as any)?.isAdmin === true || requester.mobile_number === "+911212121212" || requester.mobile_number === "+919876543210";
      if (!reqIsAdmin && requesterId !== id) {
        const reqGender = (requester.gender || "").toLowerCase();
        const targetGender = (user.gender || "").toLowerCase();
        if (reqGender && targetGender && reqGender === targetGender) {
          res.status(403).json({ success: false, message: "Access forbidden. Same-gender profile visibility is restricted." });
          return;
        }
      }
    }

    // Remove password hash from response for security
    const { password, ...safeUser } = user as any;
    res.status(200).json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch user" });
  }
});


user_route.put('/:id/premium', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }
    const { is_premium } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { is_premium: !!is_premium }
    });
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update premium status" });
  }
});

const KYC_UPLOADS_DIR = path.join(process.cwd(), "kyc-uploads");

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
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      return;
    }

    const { fileName } = req.params;

    // Check authorization: must be admin OR the user who owns this document
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const isAdmin = (user.profile_details as any)?.isAdmin === true || user.mobile_number === "+911212121212" || user.mobile_number === "+919876543210";
    const isOwner = user.kyc_front_url === fileName || user.kyc_back_url === fileName;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: "Forbidden. You do not have permission to view this document." });
      return;
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

export default user_route;