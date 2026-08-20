import { Request, Response, NextFunction } from "express";
import { ValidateReferralCodeUseCase } from "../application/use-cases/ValidateReferralCode.usecase";
import { GetMyReferralInfoUseCase } from "../application/use-cases/GetMyReferralInfo.usecase";
import { GetReferralHistoryUseCase } from "../application/use-cases/GetReferralHistory.usecase";
import { GetReferralTransactionsUseCase } from "../application/use-cases/GetReferralTransactions.usecase";
import { RedeemReferralPointsUseCase } from "../application/use-cases/RedeemReferralPoints.usecase";
import { GenerateGuestReferralUseCase } from "../application/use-cases/GenerateGuestReferral.usecase";
import { getUserIdFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError, BadRequestError } from "../../../shared/errors/AppError";

export class ReferralController {
  constructor(
    private validateReferralCodeUseCase: ValidateReferralCodeUseCase,
    private getMyReferralInfoUseCase: GetMyReferralInfoUseCase,
    private getReferralHistoryUseCase: GetReferralHistoryUseCase,
    private getReferralTransactionsUseCase: GetReferralTransactionsUseCase,
    private redeemReferralPointsUseCase: RedeemReferralPointsUseCase,
    private generateGuestReferralUseCase: GenerateGuestReferralUseCase
  ) {}

  async validateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      const userId = getUserIdFromRequest(req);

      const { referrerName } = await this.validateReferralCodeUseCase.execute(code, userId);
      sendSuccess(res, { referrerName }, "Valid referral code", 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const info = await this.getMyReferralInfoUseCase.execute(userId);
      sendSuccess(res, info, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const page = parseInt(req.query.page as string || "1", 10);
      const limit = parseInt(req.query.limit as string || "10", 10);

      const result = await this.getReferralHistoryUseCase.execute(userId, page, limit);
      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const page = parseInt(req.query.page as string || "1", 10);
      const limit = parseInt(req.query.limit as string || "10", 10);

      const result = await this.getReferralTransactionsUseCase.execute(userId, page, limit);
      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async redeem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      await this.redeemReferralPointsUseCase.execute(userId, req.body.points);
      sendSuccess(res, undefined, "Points redeemed successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async generateGuestReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, mobile_number } = req.body;
      const referralCode = await this.generateGuestReferralUseCase.execute(name, mobile_number);
      sendSuccess(res, { referralCode }, "Referral code generated successfully.", 200);
    } catch (error) {
      next(error);
    }
  }
}
