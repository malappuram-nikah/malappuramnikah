import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { KycValidator } from "../../domain/services/KycValidator";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class ReviewKycUseCase {
  constructor(private kycRepository: IKycRepository) {}

  async execute(adminId: number, applicationId: number): Promise<{ message: string }> {
    if (!adminId || !applicationId) {
      throw new BadRequestError("Admin ID and Application ID are required.");
    }

    const application = await this.kycRepository.getApplicationById(applicationId);
    if (!application) {
      throw new NotFoundError("KYC Application not found.");
    }

    KycValidator.validateStateTransition(application.status, "REVIEW");

    const prevStatus = application.status;
    await this.kycRepository.updateApplicationStatus(application.id, "UNDER_REVIEW");
    await this.kycRepository.createAuditLog(
      application.id,
      adminId,
      "REVIEW_STARTED",
      prevStatus,
      "UNDER_REVIEW",
      "Admin started review process."
    );

    return { message: "KYC Application status updated to UNDER_REVIEW." };
  }
}
