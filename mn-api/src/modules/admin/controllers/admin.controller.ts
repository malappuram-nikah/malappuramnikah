import { Request, Response, NextFunction } from "express";
import { AdminLoginUseCase } from "../application/use-cases/AdminLogin.usecase";
import { GetAdminStatsUseCase } from "../application/use-cases/GetAdminStats.usecase";
import { GetAdminUsersUseCase } from "../application/use-cases/GetAdminUsers.usecase";
import { UpdateUserAccountStatusUseCase } from "../application/use-cases/UpdateUserAccountStatus.usecase";
import { VerifyUserProfileUseCase } from "../application/use-cases/VerifyUserProfile.usecase";
import { ToggleUserPremiumUseCase } from "../application/use-cases/ToggleUserPremium.usecase";
import { GetAdminStoreUseCase } from "../application/use-cases/GetAdminStore.usecase";
import { sendSuccess } from "../../../shared/utils/response.util";
import { extractTokenFromRequest } from "../../../shared/auth/jwt.util";

export class AdminController {
  constructor(
    private adminLoginUseCase: AdminLoginUseCase,
    private getAdminStatsUseCase: GetAdminStatsUseCase,
    private getAdminUsersUseCase: GetAdminUsersUseCase,
    private updateUserAccountStatusUseCase: UpdateUserAccountStatusUseCase,
    private verifyUserProfileUseCase: VerifyUserProfileUseCase,
    private toggleUserPremiumUseCase: ToggleUserPremiumUseCase,
    private getAdminStoreUseCase: GetAdminStoreUseCase
  ) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.adminLoginUseCase.execute(req.body);
      sendSuccess(res, result, "Admin authenticated successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.getAdminStatsUseCase.execute();
      sendSuccess(res, { stats }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getAdminUsersUseCase.execute(req.query);
      sendSuccess(res, result, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      const token = extractTokenFromRequest(req) || undefined;
      const user = await this.getAdminUsersUseCase.executeGetById(id, token);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      sendSuccess(res, { user }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      const { action } = req.body;
      const user = await this.updateUserAccountStatusUseCase.execute(id, action);
      sendSuccess(res, { user }, `User account ${action}d successfully.`, 200);
    } catch (error) {
      next(error);
    }
  }

  async verifyUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      const { action } = req.body;
      await this.verifyUserProfileUseCase.execute(id, action);
      sendSuccess(res, undefined, `Successfully ${action === "approve" ? "approved" : "rejected"} matrimony profile!`, 200);
    } catch (error) {
      next(error);
    }
  }

  async togglePremium(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      const is_premium = await this.toggleUserPremiumUseCase.execute(id);
      sendSuccess(res, undefined, "Premium status updated successfully!", 200, { is_premium });
    } catch (error) {
      next(error);
    }
  }

  async getStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = this.getAdminStoreUseCase.execute();
      sendSuccess(res, { store }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }
}
