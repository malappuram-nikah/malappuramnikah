import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { IStorageRepository } from "../../../../shared/storage/IStorageRepository";
import { KycValidator } from "../../domain/services/KycValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export interface ReplaceDocumentDto {
  userId: number;
  documentType: string;
  frontBase64: string;
  backBase64?: string;
}

export class ReplaceDocumentUseCase {
  constructor(
    private kycRepository: IKycRepository,
    private storageRepository: IStorageRepository
  ) {}

  async execute(dto: ReplaceDocumentDto): Promise<{ message: string; applicationId: number }> {
    const docTypeUpper = KycValidator.validateDocType(dto.documentType);
    KycValidator.validateBase64File(dto.frontBase64, "Front document");

    if (dto.backBase64) {
      KycValidator.validateBase64File(dto.backBase64, "Back document");
    }

    const application = await this.kycRepository.getApplicationByUserId(dto.userId);
    if (!application) {
      throw new NotFoundError("No existing KYC application found. Please submit a new KYC application first.");
    }

    KycValidator.validateOwnership(application.user_id, dto.userId);
    KycValidator.validateStateTransition(application.status, "REPLACE");

    // Upload new documents securely
    const frontUpload = await this.storageRepository.uploadFile(dto.frontBase64, "kyc");
    let backUrl: string | undefined = undefined;

    if (dto.backBase64) {
      const backUpload = await this.storageRepository.uploadFile(dto.backBase64, "kyc");
      backUrl = backUpload.url;
    }

    // Update document records
    await this.kycRepository.addOrReplaceDocument(application.id, docTypeUpper, frontUpload.url, backUrl || null);
    await this.kycRepository.updateUserKyc(dto.userId, docTypeUpper, frontUpload.fileName || frontUpload.url, backUrl || null);

    return {
      message: "KYC document replaced successfully.",
      applicationId: application.id,
    };
  }
}
