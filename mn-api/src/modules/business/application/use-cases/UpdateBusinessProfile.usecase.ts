import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessProfileEntity } from "../../domain/entities/business.entity";
import { BusinessValidator } from "../../domain/services/BusinessValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class UpdateBusinessProfileUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(userId: number, businessId: number, data: Partial<BusinessProfileEntity>): Promise<BusinessProfileEntity> {
    const profile = await this.businessRepository.findProfileById(businessId);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }

    BusinessValidator.validateOwnership(userId, profile);

    // Prevent direct mutation of system fields via user update
    delete data.average_rating;
    delete data.total_reviews;
    delete data.total_completed_bookings;
    delete data.user_id;

    return await this.businessRepository.updateProfile(businessId, data);
  }
}
