import { Request, Response, NextFunction } from "express";
import { GetPublicStatsUseCase } from "../application/use-cases/GetPublicStats.usecase";
import { GetProfilesUseCase } from "../application/use-cases/GetProfiles.usecase";
import { GetUserByIdUseCase } from "../application/use-cases/GetUserById.usecase";
import { UpdateProfileUseCase } from "../application/use-cases/UpdateProfile.usecase";
import { DeleteUserUseCase } from "../application/use-cases/DeleteUser.usecase";
import { getUserIdFromRequest, isAdminTokenFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError, BadRequestError } from "../../../shared/errors/AppError";
import {
  getProfileSection,
  updateProfileSection,
  getProfileCompletionForUser,
} from "../../../application/services/ProfileSectionService";

export class ProfileController {
  constructor(
    private getPublicStatsUseCase: GetPublicStatsUseCase,
    private getProfilesUseCase: GetProfilesUseCase,
    private getUserByIdUseCase: GetUserByIdUseCase,
    private updateProfileUseCase: UpdateProfileUseCase,
    private deleteUserUseCase: DeleteUserUseCase
  ) {}

  async getPublicStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.getPublicStatsUseCase.execute();
      sendSuccess(res, { stats }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async getProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        throw new UnauthorizedError("Unauthorized. Token missing or invalid.");
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const ids = req.query.ids
        ? (req.query.ids as string).split(",").map((id) => parseInt(id, 10)).filter((n) => !isNaN(n))
        : undefined;
      const lightweight = req.query.lightweight === "true";
      const isAdmin = isAdminTokenFromRequest(req);

      const users = await this.getProfilesUseCase.execute(
        { limit, ids, lightweight },
        requesterId,
        isAdmin
      );

      sendSuccess(res, { users }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!idParam) {
        throw new BadRequestError("Invalid user identifier");
      }

      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        throw new UnauthorizedError("Unauthorized. Missing or invalid token.");
      }

      const isAdmin = isAdminTokenFromRequest(req);
      const result = await this.getUserByIdUseCase.execute(idParam, requesterId, isAdmin);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      if (isNaN(userId)) {
        throw new BadRequestError("Invalid user ID");
      }

      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        throw new UnauthorizedError("Unauthorized. Missing or invalid token.");
      }

      const isAdmin = isAdminTokenFromRequest(req);
      const result = await this.updateProfileUseCase.execute(userId, requesterId, isAdmin, req.body);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid user ID");
      }

      const requesterId = getUserIdFromRequest(req);
      if (!requesterId) {
        throw new UnauthorizedError("Unauthorized. Missing or invalid token.");
      }

      const isAdmin = isAdminTokenFromRequest(req);
      await this.deleteUserUseCase.execute(id, requesterId, isAdmin);

      sendSuccess(res, undefined, "Profile deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async getCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      if (isNaN(userId)) {
        throw new BadRequestError("Invalid user ID");
      }
      const profileCompletion = await getProfileCompletionForUser(userId);
      sendSuccess(res, { profileCompletion }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async getSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
      if (isNaN(userId) || !section) {
        throw new BadRequestError("Invalid request");
      }
      const result = await getProfileSection(userId, section);
      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
      if (isNaN(userId) || !section) {
        throw new BadRequestError("Invalid request");
      }
      const sectionData = req.body.data ?? req.body;
      const result = await updateProfileSection(userId, section, sectionData);
      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }
}
