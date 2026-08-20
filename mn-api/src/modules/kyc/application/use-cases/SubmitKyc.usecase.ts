import path from "path";
import fs from "fs";
import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { MediaStorageService } from "../../../../infrastructure/service/MediaStorageService";
import { BadRequestError, NotFoundError, ConflictError } from "../../../../shared/errors/AppError";

const KYC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "kyc");

async function deleteKycFile(fileName: string | null) {
  if (!fileName) return;
  try {
    const filePath = path.join(KYC_UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (MediaStorageService.isCloudinaryConfigured) {
      const publicId = `malappuram_nikah/kyc/${path.parse(fileName).name}`;
      const { v2: cloudinary } = require("cloudinary");
      await cloudinary.uploader.destroy(publicId, { type: "authenticated" });
    }
  } catch (err) {
    console.error(`Failed to delete KYC file ${fileName}:`, err);
  }
}

export class SubmitKycUseCase {
  constructor(private kycRepository: IKycRepository) {}

  async execute(userId: number, documentType: string, frontBase64: string, backBase64?: string): Promise<any> {
    if (!documentType) {
      throw new BadRequestError("Document type is required.");
    }

    const allowedDocTypes = [
      "Aadhaar Card",
      "Driving License",
      "Passport",
      "Voter ID",
      "National ID",
      "Other Government Issued ID",
    ];
    if (!allowedDocTypes.includes(documentType)) {
      throw new BadRequestError("Invalid document type.");
    }

    if (!frontBase64) {
      throw new BadRequestError("Front side document upload is mandatory.");
    }

    const user = await this.kycRepository.getUserKycInfo(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (user.kyc_status === "PENDING" || user.kyc_status === "UNDER_REVIEW") {
      throw new ConflictError("A verification request is already pending or under review.");
    }

    const saveDocument = async (base64Data: string, side: "front" | "back"): Promise<string> => {
      const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = "application/octet-stream";
      let base64Body = base64Data;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Body = matches[2];
      } else if (base64Data.includes(";base64,")) {
        base64Body = base64Data.split(";base64,")[1];
      }

      const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedMimes.includes(mimeType)) {
        throw new BadRequestError(`Invalid file type for ${side} side. Only JPG, JPEG, PNG, and PDF are supported.`);
      }

      const buffer = Buffer.from(base64Body, "base64");
      const maxBytes = 5 * 1024 * 1024;
      if (buffer.length > maxBytes) {
        throw new BadRequestError(`File size for ${side} side exceeds 5MB limit.`);
      }

      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "application/pdf": "pdf",
      };
      const extension = extMap[mimeType] || "bin";
      const fileName = `kyc_${userId}_${side}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;

      await MediaStorageService.uploadPrivateMedia(base64Data, fileName);
      return fileName;
    };

    const frontFileName = await saveDocument(frontBase64, "front");
    let backFileName: string | null = null;
    if (backBase64) {
      backFileName = await saveDocument(backBase64, "back");
    }

    await deleteKycFile(user.kyc_front_url);
    await deleteKycFile(user.kyc_back_url);

    const updatedUser = await this.kycRepository.updateUserKyc(userId, documentType, frontFileName, backFileName);

    await this.kycRepository.createNotification(
      userId,
      "Verification Request Submitted",
      "Your identity verification request has been submitted successfully and is pending review.",
      "KYC_SUBMITTED"
    );

    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }
}
