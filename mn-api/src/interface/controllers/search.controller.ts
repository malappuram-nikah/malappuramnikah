import { Request, Response } from "express";
import { SearchService } from "../../application/services/SearchService";
import { getUserIdFromRequest } from "../routes/interest.route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const searchService = new SearchService();

export class SearchController {
  async searchProfiles(req: Request, res: Response) {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        return res.status(401).json({ success: false, message: "Unauthorized." });
      }

      const requester = await prisma.user.findUnique({ where: { id: requesterId } });
      if (!requester) {
        return res.status(404).json({ success: false, message: "Requester not found" });
      }

      const isPremiumUser = requester.is_premium;

      const filters: any = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        ageMin: req.query.ageMin ? parseInt(req.query.ageMin as string) : undefined,
        ageMax: req.query.ageMax ? parseInt(req.query.ageMax as string) : undefined,
        heightMin: req.query.heightMin ? parseInt(req.query.heightMin as string) : undefined,
        heightMax: req.query.heightMax ? parseInt(req.query.heightMax as string) : undefined,
        gender: req.query.gender as string,
        verified: req.query.verified === "true",
        photo: req.query.photo === "true",
        online: req.query.online === "true",
        keyword: req.query.keyword as string,
        sortBy: req.query.sortBy as string,
      };

      // Ensure they only search for opposite gender unless specified otherwise (or admin)
      if (!filters.gender) {
        const reqGender = (requester.gender || "").toLowerCase();
        filters.gender = reqGender === "male" ? "female" : reqGender === "female" ? "male" : undefined;
      }

      // Arrays
      if (req.query.country) filters.country = (req.query.country as string).split(",");
      if (req.query.state) filters.state = (req.query.state as string).split(",");
      if (req.query.district) filters.district = (req.query.district as string).split(",");
      if (req.query.education) filters.education = (req.query.education as string).split(",");
      if (req.query.profession) filters.profession = (req.query.profession as string).split(",");
      if (req.query.maritalStatus) filters.maritalStatus = (req.query.maritalStatus as string).split(",");
      if (req.query.community) filters.community = (req.query.community as string).split(",");

      // Premium Arrays
      if (req.query.familyStatus) filters.familyStatus = (req.query.familyStatus as string).split(",");
      if (req.query.prayer) filters.prayer = req.query.prayer as string;
      if (req.query.hijab) filters.hijab = req.query.hijab as string;
      if (req.query.beard) filters.beard = req.query.beard as string;

      const result = await searchService.searchProfiles(filters, requesterId, isPremiumUser);
      
      // Clean up passwords and huge base64 strings from profile_details
      const cleanedData = result.data.map((u: any) => {
        const { password, ...safeUser } = u;
        if (safeUser.profile_details) {
          if (safeUser.profile_details.mn_video_intro_draft?.video?.dataUrl?.startsWith("data:")) {
            safeUser.profile_details.mn_video_intro_draft.video.dataUrl = "TRUNCATED_FOR_LISTING";
          }
          if (safeUser.profile_details.mn_voice_intro_draft?.voice?.dataUrl?.startsWith("data:")) {
            safeUser.profile_details.mn_voice_intro_draft.voice.dataUrl = "TRUNCATED_FOR_LISTING";
          }
        }
        return safeUser;
      });

      return res.status(200).json({ success: true, ...result, data: cleanedData });
    } catch (error) {
      console.error("Search API Error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  async updateSearchPreferences(req: Request, res: Response) {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        return res.status(401).json({ success: false, message: "Unauthorized." });
      }

      const { preferences } = req.body;
      if (!preferences) {
        return res.status(400).json({ success: false, message: "Preferences payload missing." });
      }

      await searchService.updateSearchPreferences(requesterId, preferences);
      return res.status(200).json({ success: true, message: "Preferences updated." });
    } catch (error) {
      console.error("Update Preferences API Error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}
