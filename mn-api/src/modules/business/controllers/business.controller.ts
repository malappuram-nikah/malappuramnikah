import { Request, Response, NextFunction } from "express";
import { ToggleBlockUseCase } from "../application/use-cases/ToggleBlock.usecase";
import { GetBlockedListUseCase } from "../application/use-cases/GetBlockedList.usecase";
import { ToggleFavouriteUseCase } from "../application/use-cases/ToggleFavourite.usecase";
import { GetFavouritesListUseCase } from "../application/use-cases/GetFavouritesList.usecase";
import { SubmitFeedbackUseCase } from "../application/use-cases/SubmitFeedback.usecase";
import { CheckBiodataPermissionUseCase } from "../application/use-cases/CheckBiodataPermission.usecase";
import { DownloadBiodataUseCase } from "../application/use-cases/DownloadBiodata.usecase";
import { getUserIdFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError, BadRequestError } from "../../../shared/errors/AppError";

export class BusinessController {
  constructor(
    private toggleBlockUseCase: ToggleBlockUseCase,
    private getBlockedListUseCase: GetBlockedListUseCase,
    private toggleFavouriteUseCase: ToggleFavouriteUseCase,
    private getFavouritesListUseCase: GetFavouritesListUseCase,
    private submitFeedbackUseCase: SubmitFeedbackUseCase,
    private checkBiodataPermissionUseCase: CheckBiodataPermissionUseCase,
    private downloadBiodataUseCase: DownloadBiodataUseCase
  ) {}

  async toggleBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) throw new UnauthorizedError("Unauthorized");

      const targetId = parseInt(req.body.target_id, 10);
      const status = await this.toggleBlockUseCase.execute(requesterId, targetId);
      sendSuccess(res, undefined, undefined, 200, { status });
    } catch (error) {
      next(error);
    }
  }

  async getBlockedList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) throw new UnauthorizedError("Unauthorized");

      const blocked_ids = await this.getBlockedListUseCase.execute(requesterId);
      sendSuccess(res, { blocked_ids }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async toggleFavourite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) throw new UnauthorizedError("Unauthorized");

      const targetId = parseInt(req.body.target_id, 10);
      const status = await this.toggleFavouriteUseCase.execute(requesterId, targetId);
      sendSuccess(res, undefined, undefined, 200, { status });
    } catch (error) {
      next(error);
    }
  }

  async getFavouritesList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) throw new UnauthorizedError("Unauthorized");

      const result = await this.getFavouritesListUseCase.execute(requesterId);
      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) throw new UnauthorizedError("Unauthorized");

      const { category, rating, subject, message } = req.body;
      const feedback = await this.submitFeedbackUseCase.execute(userId, category, rating, subject, message);

      sendSuccess(res, { feedback }, "Thank you for your feedback! It has been submitted successfully.", 201);
    } catch (error) {
      next(error);
    }
  }

  async checkBiodataPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) throw new UnauthorizedError("Unauthorized. Missing or invalid token.");

      const targetParam = Array.isArray(req.params.targetId) ? req.params.targetId[0] : req.params.targetId;
      const perm = await this.checkBiodataPermissionUseCase.execute(requesterId, targetParam);

      res.status(200).json({
        success: perm.allowed,
        allowed: perm.allowed,
        status: perm.status,
        isSelf: perm.isSelf,
        message: perm.message || (perm.allowed ? "Biodata download allowed." : "Biodata access restricted."),
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadBiodata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) throw new UnauthorizedError("Unauthorized. Missing or invalid token.");

      const targetId = req.params.targetId || req.body.targetId || req.body.receiver_id || req.body.user_id;
      if (!targetId) throw new BadRequestError("Target profile ID is required.");

      const result = await this.downloadBiodataUseCase.execute(requesterId, String(targetId));
      res.status(200).json(result);
    } catch (error: any) {
      if (error?.code) {
        res.status(403).json({
          success: false,
          message: error.message,
          code: error.code,
          status: error.status,
        });
        return;
      }
      next(error);
    }
  }
}
