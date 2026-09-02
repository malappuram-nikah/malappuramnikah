import { Request, Response } from "express";
import { RegisterUser } from "../../applications/use-cases/user/registerUser.usecase";
import { LoginUser } from "../../applications/use-cases/user/LoginUser.usecase";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { UpdateProfileDetailsUseCase } from "../../applications/use-cases/user/UpdateProfileDetails.usecase";
import { calculateProfileCompletion } from "../../application/services/ProfileCompletionService";
import { GenerateGuestReferralUseCase } from "../../applications/use-cases/user/GenerateGuestReferral.usecase";
import { MediaStorageService } from "../../infrastructure/service/MediaStorageService";
import { getUserIdFromRequest } from "../routes/interest.route";
import prisma from "../../infrastructure/prisma/prisamClient";

export class UserController {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser,
    private sendOtp: SendOtpUseCase,
    private getAllUsers: any,
    private updateProfileDetails: UpdateProfileDetailsUseCase,
    private generateGuestReferral: GenerateGuestReferralUseCase
  ) {}

  async generateReferral(req: Request, res: Response) {
    try {
      const { name, mobile_number, password } = req.body;
      if (!name || !mobile_number) {
        return res.status(400).json({ success: false, message: "Name and Mobile Number are required" });
      }

      const referralCode = await this.generateGuestReferral.execute(name, mobile_number, password);
      return res.status(200).json({ success: true, referralCode, message: "Referral code generated successfully." });
    } catch (error: any) {
      console.error("Generate referral error:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to generate referral code" });
    }
  }

  async register(req: Request, res: Response) {
    console.log(req.body, "re body");

    try {
      console.log("Request body:", req.body);
      const phoneNumber = req.body.mobile_number;

      // Check if user exists and is unverified (status is 'in_active')
      const existingUser = await prisma.user.findUnique({
        where: { mobile_number: phoneNumber }
      });
      const isUnverified = existingUser && existingUser.status === "in_active";

      const { channel: reqChannel, ...userData } = req.body;
      const user = await this.registerUser.execute(userData);
      console.log("User from use case:", user);

      const channel = reqChannel === "EMAIL" ? "EMAIL" : "WHATSAPP";
      const generatedOtp = await this.sendOtp.execute(
        phoneNumber,
        req.body.email,
        `${req.body.first_name || ""} ${req.body.last_name || ""}`.trim(),
        channel,
        "VERIFICATION"
      );
      const { password: _password, ...safeUser } = user as any;

      if (isUnverified) {
        return res
          .status(200)
          .json({
            success: true,
            unverified: true,
            message: "Your account has already been created but is not yet verified. Please verify your OTP to activate your account.",
            ...(process.env.NODE_ENV !== "production" ? { otp: generatedOtp } : {}),
            user: safeUser
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          message: "Registration successful",
          ...(process.env.NODE_ENV !== "production" ? { otp: generatedOtp } : {}),
          user: safeUser
        });
    } catch (error: any) {
      console.warn("Registration validation/conflict:", error.message || error);
      
      let message = "Registration failed";
      if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint failed'))) {
        const target = error.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');
        if (targetStr.includes('email') || (error.message && error.message.includes('email'))) {
          message = "Email address is already registered. Please log in or use a different email.";
        } else if (targetStr.includes('mobile_number') || (error.message && error.message.includes('mobile_number'))) {
          message = "Mobile number is already registered. Please log in instead.";
        } else {
          message = "An account with these details already exists. Please log in instead.";
        }
      } else if (error.message) {
        message = error.message;
      }

      return res
        .status(400)
        .json({ success: false, message });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      console.log("Request Body:", req.body);

      const { status, message, code, token, refreshToken } =
        await this.loginUser.execute({
          mobile_number: req.body.mobile_number,
          password: req.body.password,
        });

      if (status !== 200) {
        return res.status(status).json({ success: false, message, code });
      }

      const isProd = process.env.NODE_ENV === "production";
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message,
        token,
      });
    } catch (error: any) {
      console.error("Error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }

  async getProfiles(req: Request, res: Response): Promise<Response> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        return res.status(401).json({ success: false, message: "Unauthorized. Token missing or invalid." });
      }

      const requester = await prisma.user.findUnique({ where: { id: requesterId } });
      if (!requester) {
        return res.status(404).json({ success: false, message: "Requester not found" });
      }

      const reqIsAdmin = (requester.profile_details as any)?.isAdmin === true || requester.mobile_number === "+911212121212" || requester.mobile_number === "+919876543210";

      let limit: number | undefined;
      if (req.query.limit) {
        limit = parseInt(req.query.limit as string, 10);
      }

      let ids: number[] | undefined;
      if (req.query.ids) {
        ids = (req.query.ids as string).split(',').map(id => parseInt(id, 10)).filter(n => !isNaN(n));
      }

      const lightweight = req.query.lightweight === "true";

      let users: any[];
      if (reqIsAdmin) {
        users = await this.getAllUsers.execute({ limit, ids, lightweight });
      } else {
        const reqGender = (requester.gender || "").toLowerCase();
        const oppositeGender = reqGender === "male" ? "female" : reqGender === "female" ? "male" : null;

        if (!oppositeGender) {
          return res.status(200).json({ success: true, users: [] });
        }

        // Fetch only users of the opposite gender from the database
        users = await this.getAllUsers.execute({ gender: oppositeGender, limit, ids, lightweight });
      }

      // Map users to include online tracker state and prune base64 assets to save database/networking bandwidth
      const { onlineUsers } = require("../../infrastructure/onlineTracker");
      const cleanedUsers = users.map((u: any) => {
        const { password, ...safeUser } = u;
        if (safeUser.profile_details) {
          const details = { ...safeUser.profile_details };
          // Strip large base64 video/voice uploads from the grid listing response
          if (details.mn_video_intro_draft?.video?.dataUrl?.startsWith("data:")) {
            details.mn_video_intro_draft = {
              ...details.mn_video_intro_draft,
              video: { ...details.mn_video_intro_draft.video, dataUrl: "" }
            };
          }
          if (details.mn_voice_intro_draft?.voice?.dataUrl?.startsWith("data:")) {
            details.mn_voice_intro_draft = {
              ...details.mn_voice_intro_draft,
              voice: { ...details.mn_voice_intro_draft.voice, dataUrl: "" }
            };
          }
          // Strip non-primary base64 photos to keep payload size tiny
          if (details.mn_profile_photos_draft?.photos) {
            details.mn_profile_photos_draft = {
              ...details.mn_profile_photos_draft,
              photos: details.mn_profile_photos_draft.photos.map((p: any) => {
                if (p.isPrimary) return p;
                if (p.dataUrl?.startsWith("data:")) {
                  return { ...p, dataUrl: "" };
                }
                return p;
              })
            };
          }
          safeUser.profile_details = details;
        }
        return {
          ...safeUser,
          is_online: onlineUsers.has(safeUser.id)
        };
      });

      return res.status(200).json({ success: true, users: cleanedUsers });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
      }

      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        return res.status(401).json({ success: false, message: "Unauthorized. Missing or invalid token." });
      }
      if (requesterId !== userId) {
        const requester = await prisma.user.findUnique({ where: { id: requesterId } });
        const isAdmin = (requester?.profile_details as any)?.isAdmin === true
          || requester?.mobile_number === "+911212121212"
          || requester?.mobile_number === "+919876543210";
        if (!isAdmin) {
          return res.status(403).json({ success: false, message: "You can only update your own profile." });
        }
      }

      const profileDetails = req.body.profile_details;
      
      if (profileDetails) {
        // 1. Process Profile Photos Draft
        if (profileDetails.mn_profile_photos_draft && Array.isArray(profileDetails.mn_profile_photos_draft.photos)) {
          const photos = profileDetails.mn_profile_photos_draft.photos;
          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            if (photo.dataUrl && photo.dataUrl.startsWith("data:")) {
              try {
                console.log(`Processing profile photo upload ${i + 1}/${photos.length}...`);
                const uploadedUrl = await MediaStorageService.uploadMedia(photo.dataUrl, "photos");
                photo.dataUrl = uploadedUrl;
              } catch (uploadErr) {
                console.error("Failed to upload profile photo:", uploadErr);
              }
            }
          }
        }

        // 2. Process Video Onboarding Draft
        if (profileDetails.mn_video_intro_draft && profileDetails.mn_video_intro_draft.video) {
          const videoObj = profileDetails.mn_video_intro_draft.video;
          if (videoObj.dataUrl && videoObj.dataUrl.startsWith("data:")) {
            try {
              console.log("Processing video introduction upload...");
              const uploadedUrl = await MediaStorageService.uploadMedia(videoObj.dataUrl, "videos");
              videoObj.dataUrl = uploadedUrl;
            } catch (uploadErr) {
              console.error("Failed to upload video introduction:", uploadErr);
            }
          }
        }

        // 3. Process Voice Introduction Draft
        if (profileDetails.mn_voice_intro_draft && profileDetails.mn_voice_intro_draft.voice) {
          const voiceObj = profileDetails.mn_voice_intro_draft.voice;
          if (voiceObj.dataUrl && voiceObj.dataUrl.startsWith("data:")) {
            try {
              console.log("Processing voice introduction upload...");
              const uploadedUrl = await MediaStorageService.uploadMedia(voiceObj.dataUrl, "voices");
              voiceObj.dataUrl = uploadedUrl;
            } catch (uploadErr) {
              console.error("Failed to upload voice introduction:", uploadErr);
            }
          }
        }
      }

      const rawCore = req.body.core_fields || req.body;
      const coreFields: any = {};
      if (rawCore.first_name !== undefined) coreFields.first_name = rawCore.first_name;
      if (rawCore.last_name !== undefined) coreFields.last_name = rawCore.last_name;
      if (rawCore.mobile_number !== undefined) coreFields.mobile_number = rawCore.mobile_number;
      if (rawCore.location !== undefined) coreFields.location = rawCore.location;
      if (rawCore.dob !== undefined) coreFields.dob = rawCore.dob;
      if (rawCore.cast !== undefined) coreFields.cast = rawCore.cast;
      if (rawCore.gender !== undefined) coreFields.gender = rawCore.gender;
      if (rawCore.profile_for !== undefined) coreFields.profile_for = rawCore.profile_for;

      const updatedUser = await this.updateProfileDetails.execute(userId, profileDetails, coreFields);
      const { password: _password, ...safeUser } = updatedUser as any;
      const profileCompletion = calculateProfileCompletion(updatedUser as any);
      
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: safeUser,
        profileCompletion,
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
    }
  }
}
