import { Request, Response, NextFunction } from "express";
import { SearchProfilesUseCase } from "../../application/use-cases/SearchProfiles.usecase";
import { PrismaSearchRepository } from "../../infrastructure/repositories/PrismaSearchRepository";
import { PrismaBlockRepository } from "../../../interactions/infrastructure/repositories/PrismaBlockRepository";
import { sendSuccess } from "../../../../shared/utils/response.util";

const searchRepo = new PrismaSearchRepository();
const blockRepo = new PrismaBlockRepository();
const searchProfilesUseCase = new SearchProfilesUseCase(searchRepo, blockRepo);

export class SearchController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestingUserId = (req as any).user?.userId;

      const criteria = {
        gender: req.query.gender as string,
        minAge: req.query.minAge ? parseInt(req.query.minAge as string, 10) : undefined,
        maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string, 10) : undefined,
        minHeightCm: req.query.minHeightCm ? parseInt(req.query.minHeightCm as string, 10) : undefined,
        maxHeightCm: req.query.maxHeightCm ? parseInt(req.query.maxHeightCm as string, 10) : undefined,
        maritalStatus: req.query.maritalStatus as string,
        district: req.query.district as string,
        state: req.query.state as string,
        country: req.query.country as string,
        highestEducation: req.query.highestEducation as string,
        profession: req.query.profession as string,
        motherTongue: req.query.motherTongue as string,
        sortBy: (req.query.sortBy as any) || "created_at",
        sortOrder: (req.query.sortOrder as any) || "desc",
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await searchProfilesUseCase.execute(criteria, requestingUserId);
      sendSuccess(res, result, "Search results retrieved successfully.", 200);
    } catch (err) {
      next(err);
    }
  }
}
