import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { SubmitKycUseCase } from "../application/use-cases/SubmitKyc.usecase";
import { GetKycDocumentUseCase } from "../application/use-cases/GetKycDocument.usecase";
import { getUserIdFromRequest, isAdminTokenFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError } from "../../../shared/errors/AppError";

export class KycController {
  constructor(
    private submitKycUseCase: SubmitKycUseCase,
    private getKycDocumentUseCase: GetKycDocumentUseCase
  ) {}

  async submitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized. Missing or invalid token.");
      }

      const { document_type, front_base64, back_base64 } = req.body;
      const safeUser = await this.submitKycUseCase.execute(userId, document_type, front_base64, back_base64);

      sendSuccess(res, { user: safeUser }, "KYC documents submitted successfully.", 200);
    } catch (error) {
      next(error);
    }
  }

  async getKycDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = isAdminTokenFromRequest(req);
      const userId = getUserIdFromRequest(req);

      const fileName = (Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName) as string;

      const docInfo = await this.getKycDocumentUseCase.execute(fileName, userId, isAdmin);

      if (docInfo.isCloudinary && docInfo.signedUrl) {
        res.redirect(docInfo.signedUrl);
        return;
      }

      if (docInfo.filePath) {
        res.setHeader("Content-Type", docInfo.contentType);
        res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
        const fileStream = fs.createReadStream(docInfo.filePath);
        fileStream.pipe(res);
        return;
      }
    } catch (error) {
      next(error);
    }
  }
}
