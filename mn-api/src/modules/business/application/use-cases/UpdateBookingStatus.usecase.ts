import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessBookingEntity, BookingStatus } from "../../domain/entities/business.entity";
import { BusinessValidator } from "../../domain/services/BusinessValidator";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors/AppError";

export class UpdateBookingStatusUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(userId: number, bookingId: number, targetStatus: BookingStatus): Promise<BusinessBookingEntity> {
    const booking = await this.businessRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found.");
    }

    const profile = await this.businessRepository.findProfileById(booking.business_id);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }

    const isCustomer = booking.customer_id === userId;
    const isOwner = profile.user_id === userId;

    if (!isCustomer && !isOwner) {
      throw new ForbiddenError("Unauthorized: You do not have access to manage this booking.");
    }

    if (targetStatus === "CANCELLED" && !isCustomer && !isOwner) {
      throw new ForbiddenError("Only customer or business owner can cancel a booking.");
    }

    if ((targetStatus === "CONFIRMED" || targetStatus === "REJECTED" || targetStatus === "COMPLETED") && !isOwner) {
      throw new ForbiddenError("Only the business owner can confirm, reject, or complete bookings.");
    }

    BusinessValidator.validateBookingStatusTransition(booking.status, targetStatus);

    const updatedBooking = await this.businessRepository.updateBookingStatus(bookingId, targetStatus);

    // If completed, update business completed bookings stat & recalculate ranking
    if (targetStatus === "COMPLETED") {
      const newTotalCompleted = profile.total_completed_bookings + 1;
      await this.businessRepository.updateBusinessStats(
        profile.id,
        profile.average_rating,
        profile.total_reviews,
        newTotalCompleted
      );
    }

    return updatedBooking;
  }
}
