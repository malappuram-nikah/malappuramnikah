import { Request, Response } from "express";
import { RegisterUser } from "../../applications/use-cases/user/registerUser.usecase";
import { LoginUser } from "../../applications/use-cases/user/LoginUser.usecase";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { UpdateProfileDetailsUseCase } from "../../applications/use-cases/user/UpdateProfileDetails.usecase";
import { MediaStorageService } from "../../infrastructure/service/MediaStorageService";

export class UserController {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser,
    private sendOtp: SendOtpUseCase,
    private getAllUsers: any,
    private updateProfileDetails: UpdateProfileDetailsUseCase
  ) {}

  async register(req: Request, res: Response) {
    console.log(req.body, "re body");

    try {
      console.log("Request body:", req.body);
      const user = await this.registerUser.execute(req.body);
      console.log("User from use case:", user);

      const phoneNumber = req.body.mobile_number;
      await this.sendOtp.execute(phoneNumber);

      return res
        .status(200)
        .json({ success: true, message: "Registration successful", user });
    } catch (error: any) {
      console.error("Error during registration:", error);
      
      let message = "Registration failed";
      if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint failed'))) {
        message = "Mobile number already exists. Please log in instead.";
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

      const { status, message, token, refreshToken } =
        await this.loginUser.execute({
          mobile_number: req.body.mobile_number,
          password: req.body.password,
        });

      if (status !== 200) {
        return res.status(status).json({ success: false, message });
      }

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
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
      const users = await this.getAllUsers.execute();
      return res.status(200).json({ success: true, users });
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

      const updatedUser = await this.updateProfileDetails.execute(userId, profileDetails);
      
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
    }
  }
}
