import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessOfferEntity } from "../../domain/entities/business.entity";
import { BusinessValidator } from "../../domain/services/BusinessValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class ManageBusinessOfferUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async createOffer(
    userId: number,
    businessId: number,
    title: string,
    price: number,
    validityFrom: Date,
    validityTo: Date,
    description?: string,
    discountedPrice?: number
  ): Promise<BusinessOfferEntity> {
    const profile = await this.businessRepository.findProfileById(businessId);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);
    BusinessValidator.validateOfferDates(validityFrom, validityTo);

    return await this.businessRepository.createOffer({
      business_id: businessId,
      title,
      description,
      price,
      discounted_price: discountedPrice,
      validity_from: validityFrom,
      validity_to: validityTo,
    });
  }

  async toggleOfferStatus(
    userId: number,
    offerId: number,
    isActive: boolean
  ): Promise<BusinessOfferEntity> {
    const offer = await this.businessRepository.findOfferById(offerId);
    if (!offer) {
      throw new NotFoundError("Offer not found.");
    }
    const profile = await this.businessRepository.findProfileById(offer.business_id);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);

    return await this.businessRepository.updateOffer(offerId, { is_active: isActive });
  }

  async deleteOffer(userId: number, offerId: number): Promise<void> {
    const offer = await this.businessRepository.findOfferById(offerId);
    if (!offer) {
      throw new NotFoundError("Offer not found.");
    }
    const profile = await this.businessRepository.findProfileById(offer.business_id);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);

    await this.businessRepository.deleteOffer(offerId);
  }

  async getActiveOffers(businessId: number): Promise<BusinessOfferEntity[]> {
    const offers = await this.businessRepository.getActiveOffers(businessId);
    const now = new Date();
    // Exclude expired offers
    return offers.filter((o) => new Date(o.validity_to).getTime() >= now.getTime());
  }
}
