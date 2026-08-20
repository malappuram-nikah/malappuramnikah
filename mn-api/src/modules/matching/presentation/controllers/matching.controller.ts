import { Request, Response, NextFunction } from "express";
import { CalculateMatchScoreUseCase } from "../../application/use-cases/CalculateMatchScore.usecase";
import { GetRecommendedMatchesUseCase } from "../../application/use-cases/GetRecommendedMatches.usecase";
import { PrismaSearchRepository } from "../../../search/infrastructure/repositories/PrismaSearchRepository";
import { PrismaBlockRepository } from "../../../interactions/infrastructure/repositories/PrismaBlockRepository";
import { sendSuccess } from "../../../../shared/utils/response.util";
import { BadRequestError } from "../../../../shared/errors/AppError";

const searchRepo = new PrismaSearchRepository();
const blockRepo = new PrismaBlockRepository();

const calculateMatchScoreUseCase = new CalculateMatchScoreUseCase();
const getRecommendedMatchesUseCase = new GetRecommendedMatchesUseCase(searchRepo, blockRepo);

export class MatchingController {
  static async calculateMatchScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestingUserId = (req as any).user?.userId;
      const targetUserId = parseInt(req.params.targetUserId, 10);

      if (isNaN(targetUserId)) {
        throw new BadRequestError("Valid targetUserId is required.");
      }

      const scoreResult = await calculateMatchScoreUseCase.execute(requestingUserId, targetUserId);
      sendSuccess(res, scoreResult, "Match score calculated successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestingUserId = (req as any).user?.userId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const recommendations = await getRecommendedMatchesUseCase.execute(requestingUserId, page, limit);
      sendSuccess(res, recommendations, "Recommended matches retrieved successfully.", 200);
    } catch (err) {
      next(err);
    }
  }
}
