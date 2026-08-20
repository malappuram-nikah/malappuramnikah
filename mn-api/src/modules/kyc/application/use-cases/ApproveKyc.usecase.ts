import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { KycValidator } from "../../domain/services/KycValidator";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class ApproveKycUseCase {
  constructor(private kycRepository: IKycRepository) {}

  async execute(adminId: number, applicationId: number): Promise<{ message: string }> {
    if (!adminId || !applicationId) {
      throw new BadRequestError("Admin ID and Application ID are required.");
    }

    const application = await this.kycRepository.getApplicationById(applicationId);
    if (!application) {
      throw new NotFoundError("KYC Application not found.");
    }

    KycValidator.validateStateTransition(application.status, "APPROVE");

    const prevStatus = application.status;
    await this.kycRepository.updateApplicationStatus(application.id, "VERIFIED");
    await this.kycRepository.createAuditLog(
      application.id,
      adminId,
      "APPROVE_KYC",
      prevStatus,
      "VERIFIED",
      "KYC verified successfully by administrator."
    );

    await this.kycRepository.createNotification(
      application.user_id,
      "KYC Verified! 🎉",
      "Congratulations! Your identity verification (KYC) has been approved by the admin team.",
      "KYC_APPROVED"
    );

    return { message: "KYC Application approved successfully." };
  }
}
