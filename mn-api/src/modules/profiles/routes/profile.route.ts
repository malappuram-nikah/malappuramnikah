import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { GetPublicStatsUseCase } from "../application/use-cases/GetPublicStats.usecase";
import { GetProfilesUseCase } from "../application/use-cases/GetProfiles.usecase";
import { GetUserByIdUseCase } from "../application/use-cases/GetUserById.usecase";
import { UpdateProfileUseCase } from "../application/use-cases/UpdateProfile.usecase";
import { DeleteUserUseCase } from "../application/use-cases/DeleteUser.usecase";
import { PrismaProfileRepository } from "../infrastructure/repositories/PrismaProfileRepository";
import { createMemberAccountGuard } from "../../../shared/authorization/memberAccount.guard";

const profileRouter = Router();

const profileRepository = new PrismaProfileRepository();

const getPublicStatsUseCase = new GetPublicStatsUseCase(profileRepository);
const getProfilesUseCase = new GetProfilesUseCase(profileRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(profileRepository);
const updateProfileUseCase = new UpdateProfileUseCase(profileRepository);
const deleteUserUseCase = new DeleteUserUseCase(profileRepository);

const profileController = new ProfileController(
  getPublicStatsUseCase,
  getProfilesUseCase,
  getUserByIdUseCase,
  updateProfileUseCase,
  deleteUserUseCase
);

// Public route
profileRouter.get("/public-stats", (req, res, next) => profileController.getPublicStats(req, res, next));

// Protected routes (apply member account guard)
profileRouter.use(createMemberAccountGuard({ allowSelfProfileGet: true }));

profileRouter.get("/profiles", (req, res, next) => profileController.getProfiles(req, res, next));
profileRouter.get("/:id/profile/completion", (req, res, next) => profileController.getCompletion(req, res, next));
profileRouter.get("/:id/profile/sections/:section", (req, res, next) => profileController.getSection(req, res, next));
profileRouter.put("/:id/profile/sections/:section", (req, res, next) => profileController.updateSection(req, res, next));
profileRouter.put("/:id/profile", (req, res, next) => profileController.updateProfile(req, res, next));
profileRouter.get("/:id", (req, res, next) => profileController.getUserById(req, res, next));
profileRouter.delete("/:id", (req, res, next) => profileController.deleteUser(req, res, next));

export default profileRouter;
