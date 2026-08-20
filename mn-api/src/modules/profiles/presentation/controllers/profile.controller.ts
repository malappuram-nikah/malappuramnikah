import { Request, Response, NextFunction } from "express";
import { GetProfileUseCase } from "../../application/use-cases/GetProfile.usecase";
import { UpdateBasicDetailsUseCase } from "../../application/use-cases/UpdateBasicDetails.usecase";
import { UpdateLocationDetailsUseCase } from "../../application/use-cases/UpdateLocationDetails.usecase";
import { UpdateEducationUseCase } from "../../application/use-cases/UpdateEducation.usecase";
import { UpdateOccupationUseCase } from "../../application/use-cases/UpdateOccupation.usecase";
import { UpdateFamilyDetailsUseCase } from "../../application/use-cases/UpdateFamilyDetails.usecase";
import { UpdatePreferencesUseCase } from "../../application/use-cases/UpdatePreferences.usecase";
import { UpdatePrivacySettingsUseCase } from "../../application/use-cases/UpdatePrivacySettings.usecase";
import { UploadProfileMediaUseCase } from "../../application/use-cases/UploadProfileMedia.usecase";
import { DeleteProfileMediaUseCase } from "../../application/use-cases/DeleteProfileMedia.usecase";
import { SetPrimaryMediaUseCase } from "../../application/use-cases/SetPrimaryMedia.usecase";
import { PrismaProfileRepository } from "../../infrastructure/repositories/PrismaProfileRepository";
import { MediaStorageAdapter } from "../../../../infrastructure/storage/MediaStorageAdapter";
import { sendSuccess } from "../../../../shared/utils/response.util";

const profileRepository = new PrismaProfileRepository();
const storageRepository = new MediaStorageAdapter();

const getProfileUseCase = new GetProfileUseCase(profileRepository);
const updateBasicDetailsUseCase = new UpdateBasicDetailsUseCase(profileRepository);
const updateLocationDetailsUseCase = new UpdateLocationDetailsUseCase(profileRepository);
const updateEducationUseCase = new UpdateEducationUseCase(profileRepository);
const updateOccupationUseCase = new UpdateOccupationUseCase(profileRepository);
const updateFamilyDetailsUseCase = new UpdateFamilyDetailsUseCase(profileRepository);
const updatePreferencesUseCase = new UpdatePreferencesUseCase(profileRepository);
const updatePrivacySettingsUseCase = new UpdatePrivacySettingsUseCase(profileRepository);
const uploadProfileMediaUseCase = new UploadProfileMediaUseCase(profileRepository, storageRepository);
const deleteProfileMediaUseCase = new DeleteProfileMediaUseCase(profileRepository);
const setPrimaryMediaUseCase = new SetPrimaryMediaUseCase(profileRepository);

export class ProfileController {
  static async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const profile = await getProfileUseCase.execute(userId);
      sendSuccess(res, profile, "Profile fetched successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = parseInt(req.params.id, 10);
      const profile = await getProfileUseCase.execute(targetId);
      sendSuccess(res, profile, "Profile fetched successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateBasicDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await updateBasicDetailsUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateLocationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await updateLocationDetailsUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateEducationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await updateEducationUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateOccupationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await updateOccupationUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateFamilyDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await updateFamilyDetailsUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await updatePreferencesUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updatePrivacySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await updatePrivacySettingsUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await uploadProfileMediaUseCase.execute({ userId, fileData: req.body.fileData, ...req.body });
      sendSuccess(res, result.media, result.message, 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const mediaId = parseInt(req.params.mediaId, 10);
      const result = await deleteProfileMediaUseCase.execute(userId, mediaId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async setPrimaryMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const mediaId = parseInt(req.params.mediaId, 10);
      const result = await setPrimaryMediaUseCase.execute(userId, mediaId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }
}
