import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { KycValidator } from "../../domain/services/KycValidator";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class RejectKycUseCase {
  constructor(private kycRepository: IKycRepository) {}

  async execute(adminId: number, applicationId: number, reason: string): Promise<{ message: string }> {
    if (!adminId || !applicationId) {
      throw new BadRequestError("Admin ID and Application ID are required.");
    }
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError("Rejection reason is required.");
    }

    const application = await this.kycRepository.getApplicationById(applicationId);
    if (!application) {
      throw new NotFoundError("KYC Application not found.");
    }

    KycValidator.validateStateTransition(application.status, "REJECT");

    const prevStatus = application.status;
    await this.kycRepository.updateApplicationStatus(application.id, "REJECTED", reason);
    await this.kycRepository.createAuditLog(
      application.id,
      adminId,
      "REJECT_KYC",
      prevStatus,
      "REJECTED",
      reason
    );

    await this.kycRepository.createNotification(
      application.user_id,
      "KYC Verification Rejected",
      `Your identity verification (KYC) was not approved. Reason: ${reason}. Please resubmit clean documents.`,
      "KYC_REJECTED"
    );

    return { message: "KYC Application rejected." };
  }
}
