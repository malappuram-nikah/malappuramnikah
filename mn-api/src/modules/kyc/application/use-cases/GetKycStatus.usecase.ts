import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { KycApplicationEntity } from "../../domain/entities/kyc.entity";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class GetKycStatusUseCase {
  constructor(private kycRepository: IKycRepository) {}

  async execute(userId: number): Promise<KycApplicationEntity> {
    const app = await this.kycRepository.getApplicationByUserId(userId);
    if (!app) {
      return {
        id: 0,
        user_id: userId,
        status: "NOT_SUBMITTED",
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
    return app;
  }
}
