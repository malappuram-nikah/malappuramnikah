import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessBookingEntity } from "../../domain/entities/business.entity";
import { CommissionCalculator } from "../../domain/services/CommissionCalculator";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export interface CreateBookingDTO {
  customerId: number;
  businessId: number;
  bookingDate: Date;
  grossAmount: number;
}

export class CreateBookingUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(dto: CreateBookingDTO): Promise<BusinessBookingEntity> {
    const profile = await this.businessRepository.findProfileById(dto.businessId);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    if (profile.status !== "ACTIVE") {
      throw new BadRequestError("Cannot book a business that is suspended or inactive.");
    }

    const commission = CommissionCalculator.calculate(
      dto.grossAmount,
      profile.monetization_model
    );

    return await this.businessRepository.createBooking({
      business_id: dto.businessId,
      customer_id: dto.customerId,
      booking_date: dto.bookingDate,
      gross_amount: commission.grossAmount,
      monetization_model: profile.monetization_model,
      commission_rate: commission.commissionRate,
      commission_amount: commission.commissionAmount,
      business_amount: commission.businessAmount,
    });
  }
}
