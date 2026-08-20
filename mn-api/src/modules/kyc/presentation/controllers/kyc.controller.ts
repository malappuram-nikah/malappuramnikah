import { Request, Response, NextFunction } from "express";
import { SubmitKycUseCase } from "../../application/use-cases/SubmitKyc.usecase";
import { ReplaceDocumentUseCase } from "../../application/use-cases/ReplaceDocument.usecase";
import { ReviewKycUseCase } from "../../application/use-cases/ReviewKyc.usecase";
import { ApproveKycUseCase } from "../../application/use-cases/ApproveKyc.usecase";
import { RejectKycUseCase } from "../../application/use-cases/RejectKyc.usecase";
import { ResubmitKycUseCase } from "../../application/use-cases/ResubmitKyc.usecase";
import { GetKycStatusUseCase } from "../../application/use-cases/GetKycStatus.usecase";
import { GetKycDocumentUseCase } from "../../application/use-cases/GetKycDocument.usecase";
import { PrismaKycRepository } from "../../infrastructure/repositories/PrismaKycRepository";
import { MediaStorageAdapter } from "../../../../infrastructure/storage/MediaStorageAdapter";
import { sendSuccess } from "../../../../shared/utils/response.util";
import { ForbiddenError } from "../../../../shared/errors/AppError";

const kycRepository = new PrismaKycRepository();
const storageRepository = new MediaStorageAdapter();

const submitKycUseCase = new SubmitKycUseCase(kycRepository, storageRepository);
const replaceDocumentUseCase = new ReplaceDocumentUseCase(kycRepository, storageRepository);
const reviewKycUseCase = new ReviewKycUseCase(kycRepository);
const approveKycUseCase = new ApproveKycUseCase(kycRepository);
const rejectKycUseCase = new RejectKycUseCase(kycRepository);
const resubmitKycUseCase = new ResubmitKycUseCase(kycRepository, storageRepository);
const getKycStatusUseCase = new GetKycStatusUseCase(kycRepository);
const getKycDocumentUseCase = new GetKycDocumentUseCase(kycRepository);

export class KycController {
  static async submitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await submitKycUseCase.execute({ userId, ...req.body });
      sendSuccess(res, { applicationId: result.applicationId }, result.message, 201);
    } catch (err) {
      next(err);
    }
  }

  static async replaceDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await replaceDocumentUseCase.execute({ userId, ...req.body });
      sendSuccess(res, { applicationId: result.applicationId }, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async resubmitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await resubmitKycUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getKycStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const status = await getKycStatusUseCase.execute(userId);
      sendSuccess(res, status, "KYC status retrieved successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getKycDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileName = req.params.fileName;
      const user = (req as any).user;
      const requesterId = user?.userId ? parseInt(String(user.userId), 10) : null;
      const isAdmin = !!user?.isAdmin;

      const docInfo = await getKycDocumentUseCase.execute(fileName, requesterId, isAdmin);

      if (docInfo.isCloudinary && docInfo.signedUrl) {
        res.redirect(docInfo.signedUrl);
        return;
      }

      if (docInfo.filePath) {
        res.setHeader("Content-Type", docInfo.contentType);
        res.sendFile(docInfo.filePath);
        return;
      }

      res.status(404).json({ success: false, error: "File not found" });
    } catch (err) {
      next(err);
    }
  }

  static async reviewKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.isAdmin;
      if (!isAdmin) throw new ForbiddenError("Only authorized admins can review KYC applications.");

      const applicationId = parseInt(req.params.applicationId, 10);
      const result = await reviewKycUseCase.execute(adminId, applicationId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async approveKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.isAdmin;
      if (!isAdmin) throw new ForbiddenError("Only authorized admins can approve KYC applications.");

      const applicationId = parseInt(req.params.applicationId, 10);
      const result = await approveKycUseCase.execute(adminId, applicationId);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async rejectKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.isAdmin;
      if (!isAdmin) throw new ForbiddenError("Only authorized admins can reject KYC applications.");

      const applicationId = parseInt(req.params.applicationId, 10);
      const reason = req.body.reason;
      const result = await rejectKycUseCase.execute(adminId, applicationId, reason);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }
}
