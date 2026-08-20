import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessMediaEntity, BusinessSocialLinkEntity } from "../../domain/entities/business.entity";
import { BusinessValidator } from "../../domain/services/BusinessValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class ManageBusinessMediaUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async addMedia(
    userId: number,
    businessId: number,
    url: string,
    mediaType: string = "PHOTO",
    isPrimary: boolean = false
  ): Promise<BusinessMediaEntity> {
    const profile = await this.businessRepository.findProfileById(businessId);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);

    return await this.businessRepository.addMedia({
      business_id: businessId,
      url,
      media_type: mediaType,
      is_primary: isPrimary,
    });
  }

  async addSocialLink(
    userId: number,
    businessId: number,
    platform: string,
    url: string
  ): Promise<BusinessSocialLinkEntity> {
    const profile = await this.businessRepository.findProfileById(businessId);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);

    return await this.businessRepository.addSocialLink(businessId, platform, url);
  }
}
