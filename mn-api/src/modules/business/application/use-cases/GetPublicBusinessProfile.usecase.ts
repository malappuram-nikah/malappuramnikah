import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessProfileEntity } from "../../domain/entities/business.entity";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class GetPublicBusinessProfileUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(businessId: number, includeSuspended: boolean = false): Promise<BusinessProfileEntity> {
    const profile = await this.businessRepository.findProfileById(businessId);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }

    if (!includeSuspended && profile.status !== "ACTIVE") {
      throw new NotFoundError("Business profile is currently unavailable.");
    }

    return profile;
  }
}
