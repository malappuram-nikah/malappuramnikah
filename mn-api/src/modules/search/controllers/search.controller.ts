import { Request, Response, NextFunction } from "express";
import { SearchProfilesUseCase } from "../application/use-cases/SearchProfiles.usecase";
import { UpdateSearchPreferencesUseCase } from "../application/use-cases/UpdateSearchPreferences.usecase";
import { getUserIdFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError } from "../../../shared/errors/AppError";

export class SearchController {
  constructor(
    private searchProfilesUseCase: SearchProfilesUseCase,
    private updateSearchPreferencesUseCase: UpdateSearchPreferencesUseCase
  ) {}

  async searchProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = getUserIdFromRequest(req);
      if (!currentUserId) {
        throw new UnauthorizedError("Unauthorized. Token missing or invalid.");
      }

      const parseArrayParam = (param: any): string[] | undefined => {
        if (!param) return undefined;
        if (Array.isArray(param)) return param.map(String);
        if (typeof param === "string") return param.split(",").map((s) => s.trim());
        return undefined;
      };

      const filters = {
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 20,
        ageMin: req.query.ageMin ? parseInt(req.query.ageMin as string, 10) : undefined,
        ageMax: req.query.ageMax ? parseInt(req.query.ageMax as string, 10) : undefined,
        heightMin: req.query.heightMin ? parseInt(req.query.heightMin as string, 10) : undefined,
        heightMax: req.query.heightMax ? parseInt(req.query.heightMax as string, 10) : undefined,
        gender: req.query.gender as string,
        district: parseArrayParam(req.query.district),
        education: parseArrayParam(req.query.education),
        profession: parseArrayParam(req.query.profession),
        maritalStatus: parseArrayParam(req.query.maritalStatus),
        community: parseArrayParam(req.query.community),
        verified: req.query.verified === "true",
        recentLogin: req.query.recentLogin === "true",
        recentRegistration: req.query.recentRegistration === "true",
        hideViewed: req.query.hideViewed === "true",
        hideInterested: req.query.hideInterested === "true",
        familyStatus: parseArrayParam(req.query.familyStatus),
        financialStatus: parseArrayParam(req.query.financialStatus),
        professionType: parseArrayParam(req.query.professionType),
        bodyType: parseArrayParam(req.query.bodyType),
        ethnicity: parseArrayParam(req.query.ethnicity),
        eatingHabits: parseArrayParam(req.query.eatingHabits),
        drinkingHabits: parseArrayParam(req.query.drinkingHabits),
        religiousness: parseArrayParam(req.query.religiousness),
        prayer: req.query.prayer as string,
        hijab: req.query.hijab as string,
        beard: req.query.beard as string,
        sortBy: req.query.sortBy as string,
        lightweight: req.query.lightweight === "true",
      };

      const result = await this.searchProfilesUseCase.execute(filters, currentUserId);
      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized. Token missing or invalid.");
      }

      const result = await this.updateSearchPreferencesUseCase.execute(userId, req.body.preferences || req.body);
      sendSuccess(res, { user: result }, "Search preferences updated", 200);
    } catch (error) {
      next(error);
    }
  }
}
