import { Request, Response, NextFunction } from "express";
import { GenerateReferralCodeUseCase } from "../../application/use-cases/GenerateReferralCode.usecase";
import { ValidateReferralUseCase } from "../../application/use-cases/ValidateReferral.usecase";
import { ApplyReferralCodeUseCase } from "../../application/use-cases/ApplyReferralCode.usecase";
import { RewardReferralUseCase } from "../../application/use-cases/RewardReferral.usecase";
import { DeductPointsUseCase } from "../../application/use-cases/DeductPoints.usecase";
import { RedeemPointsUseCase } from "../../application/use-cases/RedeemPoints.usecase";
import { ExpirePointsUseCase } from "../../application/use-cases/ExpirePoints.usecase";
import { GetReferralHistoryUseCase } from "../../application/use-cases/GetReferralHistory.usecase";

import { PrismaReferralRepository } from "../../infrastructure/repositories/PrismaReferralRepository";
import { sendSuccess } from "../../../../shared/utils/response.util";
import { BadRequestError } from "../../../../shared/errors/AppError";

const referralRepo = new PrismaReferralRepository();

const generateReferralCodeUseCase = new GenerateReferralCodeUseCase(referralRepo);
const validateReferralUseCase = new ValidateReferralUseCase(referralRepo);
const applyReferralCodeUseCase = new ApplyReferralCodeUseCase(referralRepo);
const rewardReferralUseCase = new RewardReferralUseCase(referralRepo);
const deductPointsUseCase = new DeductPointsUseCase(referralRepo);
const redeemPointsUseCase = new RedeemPointsUseCase(referralRepo);
const expirePointsUseCase = new ExpirePointsUseCase(referralRepo);
const getReferralHistoryUseCase = new GetReferralHistoryUseCase(referralRepo);

export class ReferralController {
  static async getMyCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await generateReferralCodeUseCase.execute(userId);
      sendSuccess(res, result, "Referral code retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async validateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code as string || req.body.code;
      const requestingUserId = (req as any).user?.userId;

      if (!code) {
        throw new BadRequestError("Referral code is required.");
      }

      const result = await validateReferralUseCase.execute(code, requestingUserId);
      sendSuccess(res, result, "Referral code is valid.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async applyCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { code } = req.body;

      if (!code) {
        throw new BadRequestError("Referral code is required.");
      }

      const referral = await applyReferralCodeUseCase.execute(userId, code);
      sendSuccess(res, referral, "Referral code applied successfully.", 201);
    } catch (err) {
      next(err);
    }
  }

  static async rewardReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { referrerId, referredUserId } = req.body;
      if (!referrerId || !referredUserId) {
        throw new BadRequestError("Both referrerId and referredUserId are required.");
      }

      const result = await rewardReferralUseCase.execute(parseInt(referrerId, 10), parseInt(referredUserId, 10));
      sendSuccess(res, result, "Referral rewarded successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async redeemPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { points, reason } = req.body;
      const pointsToRedeem = parseInt(points, 10);

      if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
        throw new BadRequestError("Valid points number greater than 0 is required.");
      }

      const transaction = await redeemPointsUseCase.execute(userId, pointsToRedeem, reason);
      sendSuccess(res, transaction, "Points redeemed successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async deductPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, points, reason } = req.body;
      const pointsToDeduct = parseInt(points, 10);

      if (!userId || isNaN(pointsToDeduct)) {
        throw new BadRequestError("Valid userId and points are required.");
      }

      const transaction = await deductPointsUseCase.execute(parseInt(userId, 10), pointsToDeduct, reason || "Admin deduction");
      sendSuccess(res, transaction, "Points deducted successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async expirePoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, points, reason } = req.body;
      const pointsToExpire = parseInt(points, 10);

      if (!userId || isNaN(pointsToExpire)) {
        throw new BadRequestError("Valid userId and points are required.");
      }

      const transaction = await expirePointsUseCase.execute(parseInt(userId, 10), pointsToExpire, reason || "Points expiration");
      sendSuccess(res, transaction, "Points expired successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await getReferralHistoryUseCase.execute(userId, page, limit);
      sendSuccess(res, result, "Referral history retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }
}
