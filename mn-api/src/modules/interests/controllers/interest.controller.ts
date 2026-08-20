import { Request, Response, NextFunction } from "express";
import { ExpressInterestUseCase } from "../application/use-cases/ExpressInterest.usecase";
import { GetUserInterestsUseCase } from "../application/use-cases/GetUserInterests.usecase";
import { getUserIdFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError, BadRequestError } from "../../../shared/errors/AppError";

export class InterestController {
  constructor(
    private expressInterestUseCase: ExpressInterestUseCase,
    private getUserInterestsUseCase: GetUserInterestsUseCase
  ) {}

  async expressInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = getUserIdFromRequest(req);
      if (!senderId) {
        throw new UnauthorizedError("Unauthorized. Missing or invalid token.");
      }

      const receiverId = parseInt(req.body.receiver_id, 10);
      if (isNaN(receiverId)) {
        throw new BadRequestError("Invalid receiver ID");
      }

      const result = await this.expressInterestUseCase.execute(senderId, receiverId);

      if (result.status === "KYC_REQUIRED") {
        res.status(403).json({
          success: false,
          requireKyc: true,
          kycStatus: result.kycStatus,
          message: result.message,
        });
        return;
      }

      sendSuccess(res, undefined, result.message, 200, { status: result.status });
    } catch (error) {
      next(error);
    }
  }

  async getInterests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const type = req.query.type as string;
      const idsOnly = req.query.idsOnly === "true";
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await this.getUserInterestsUseCase.execute(userId, {
        type,
        idsOnly,
        page,
        limit,
      });

      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }
}
