import { Request, Response, NextFunction } from "express";
import { SendInterestUseCase } from "../../application/use-cases/SendInterest.usecase";
import { AcceptInterestUseCase } from "../../application/use-cases/AcceptInterest.usecase";
import { RejectInterestUseCase } from "../../application/use-cases/RejectInterest.usecase";
import { WithdrawInterestUseCase } from "../../application/use-cases/WithdrawInterest.usecase";
import { BlockUserUseCase } from "../../application/use-cases/BlockUser.usecase";
import { UnblockUserUseCase } from "../../application/use-cases/UnblockUser.usecase";
import { FavouriteUserUseCase } from "../../application/use-cases/FavouriteUser.usecase";
import { RemoveFavouriteUseCase } from "../../application/use-cases/RemoveFavourite.usecase";
import { RecordProfileViewUseCase } from "../../application/use-cases/RecordProfileView.usecase";
import { GetInteractionHistoryUseCase } from "../../application/use-cases/GetInteractionHistory.usecase";

import { PrismaInterestRepository } from "../../infrastructure/repositories/PrismaInterestRepository";
import { PrismaBlockRepository } from "../../infrastructure/repositories/PrismaBlockRepository";
import { PrismaFavouriteRepository } from "../../infrastructure/repositories/PrismaFavouriteRepository";
import { PrismaProfileViewRepository } from "../../infrastructure/repositories/PrismaProfileViewRepository";
import { sendSuccess } from "../../../../shared/utils/response.util";
import { BadRequestError } from "../../../../shared/errors/AppError";

const interestRepo = new PrismaInterestRepository();
const blockRepo = new PrismaBlockRepository();
const favouriteRepo = new PrismaFavouriteRepository();
const viewRepo = new PrismaProfileViewRepository();

const sendInterestUseCase = new SendInterestUseCase(interestRepo, blockRepo);
const acceptInterestUseCase = new AcceptInterestUseCase(interestRepo, blockRepo);
const rejectInterestUseCase = new RejectInterestUseCase(interestRepo);
const withdrawInterestUseCase = new WithdrawInterestUseCase(interestRepo);

const blockUserUseCase = new BlockUserUseCase(blockRepo);
const unblockUserUseCase = new UnblockUserUseCase(blockRepo);

const favouriteUserUseCase = new FavouriteUserUseCase(favouriteRepo, blockRepo);
const removeFavouriteUseCase = new RemoveFavouriteUseCase(favouriteRepo);

const recordProfileViewUseCase = new RecordProfileViewUseCase(viewRepo, blockRepo);
const getInteractionHistoryUseCase = new GetInteractionHistoryUseCase(interestRepo, blockRepo, favouriteRepo, viewRepo);

export class InteractionController {
  static async sendInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = (req as any).user?.userId;
      const receiverId = parseInt(req.body.receiver_id || req.body.receiverId, 10);

      if (isNaN(receiverId)) {
        throw new BadRequestError("Valid receiver_id is required.");
      }

      const result = await sendInterestUseCase.execute({ senderId, receiverId });
      sendSuccess(res, { interestId: result.interestId, status: result.status }, result.message, 201);
    } catch (err) {
      next(err);
    }
  }

  static async acceptInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const interestId = parseInt(req.params.interestId || req.body.interest_id, 10);

      if (isNaN(interestId)) {
        throw new BadRequestError("Valid interestId is required.");
      }

      const result = await acceptInterestUseCase.execute(interestId, userId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async rejectInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const interestId = parseInt(req.params.interestId || req.body.interest_id, 10);

      if (isNaN(interestId)) {
        throw new BadRequestError("Valid interestId is required.");
      }

      const result = await rejectInterestUseCase.execute(interestId, userId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async withdrawInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const interestId = parseInt(req.params.interestId || req.body.interest_id, 10);

      if (isNaN(interestId)) {
        throw new BadRequestError("Valid interestId is required.");
      }

      const result = await withdrawInterestUseCase.execute(interestId, userId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blockerId = (req as any).user?.userId;
      const blockedId = parseInt(req.body.blocked_id || req.body.targetUserId || req.params.targetUserId, 10);

      if (isNaN(blockedId)) {
        throw new BadRequestError("Valid blocked_id is required.");
      }

      const result = await blockUserUseCase.execute(blockerId, blockedId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blockerId = (req as any).user?.userId;
      const blockedId = parseInt(req.body.blocked_id || req.params.targetUserId, 10);

      if (isNaN(blockedId)) {
        throw new BadRequestError("Valid blocked_id is required.");
      }

      const result = await unblockUserUseCase.execute(blockerId, blockedId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async toggleFavourite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const favouriterId = (req as any).user?.userId;
      const favouritedId = parseInt(req.body.favourited_id || req.body.targetUserId || req.params.targetUserId, 10);

      if (isNaN(favouritedId)) {
        throw new BadRequestError("Valid favourited_id is required.");
      }

      const result = await favouriteUserUseCase.execute(favouriterId, favouritedId);
      sendSuccess(res, { isFavourited: result.isFavourited }, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async removeFavourite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const favouriterId = (req as any).user?.userId;
      const favouritedId = parseInt(req.body.favourited_id || req.params.targetUserId, 10);

      if (isNaN(favouritedId)) {
        throw new BadRequestError("Valid favourited_id is required.");
      }

      const result = await removeFavouriteUseCase.execute(favouriterId, favouritedId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async recordProfileView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const viewerId = (req as any).user?.userId;
      const viewedId = parseInt(req.body.viewed_id || req.params.targetUserId, 10);

      if (isNaN(viewedId)) {
        throw new BadRequestError("Valid viewed_id is required.");
      }

      const result = await recordProfileViewUseCase.execute(viewerId, viewedId);
      sendSuccess(res, { recorded: result.recorded }, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getInteractionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const history = await getInteractionHistoryUseCase.execute(userId);
      sendSuccess(res, history, "Interaction history retrieved successfully.", 200);
    } catch (err) {
      next(err);
    }
  }
}
