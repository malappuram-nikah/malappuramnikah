import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessProfileEntity, MonetizationModel } from "../../domain/entities/business.entity";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export interface CreateBusinessProfileDTO {
  userId: number;
  categoryId: number;
  businessName: string;
  description?: string;
  experienceYears?: number;
  location: string;
  phone?: string;
  email?: string;
  website?: string;
  monetizationModel?: MonetizationModel;
}

export class CreateBusinessProfileUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(dto: CreateBusinessProfileDTO): Promise<BusinessProfileEntity> {
    const existing = await this.businessRepository.findProfileByUserId(dto.userId);
    if (existing) {
      throw new BadRequestError("User already has an existing business profile.");
    }

    const category = await this.businessRepository.findCategoryById(dto.categoryId);
    if (!category || !category.is_active) {
      throw new NotFoundError("Selected business category is invalid or inactive.");
    }

    return await this.businessRepository.createProfile({
      user_id: dto.userId,
      category_id: dto.categoryId,
      business_name: dto.businessName,
      description: dto.description,
      experience_years: dto.experienceYears,
      location: dto.location,
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
      monetization_model: dto.monetizationModel || "ONE_TIME",
    });
  }
}
