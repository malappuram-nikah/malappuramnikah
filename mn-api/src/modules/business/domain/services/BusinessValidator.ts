import { BadRequestError, ForbiddenError } from "../../../../shared/errors/AppError";
import { BusinessProfileEntity, BusinessBookingEntity, BookingStatus } from "../entities/business.entity";

export class BusinessValidator {
  static validateOwnership(userId: number, profile: BusinessProfileEntity): void {
    if (profile.user_id !== userId) {
      throw new ForbiddenError("Unauthorized: You are not the owner of this business profile.");
    }
  }

  static validateOfferDates(validityFrom: Date, validityTo: Date): void {
    if (validityTo.getTime() <= validityFrom.getTime()) {
      throw new BadRequestError("Offer validity end date must be after the start date.");
    }
  }

  static validateReviewEligibility(
    booking: BusinessBookingEntity,
    userId: number,
    businessId: number
  ): void {
    if (booking.customer_id !== userId) {
      throw new ForbiddenError("Unauthorized: You can only review bookings you created.");
    }

    if (booking.business_id !== businessId) {
      throw new BadRequestError("Booking does not belong to the target business.");
    }

    if (booking.status !== "COMPLETED") {
      throw new ForbiddenError("Reviews can only be submitted for COMPLETED bookings.");
    }
  }

  static validateBookingStatusTransition(currentStatus: BookingStatus, targetStatus: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
      CONFIRMED: ["COMPLETED", "CANCELLED"],
      REJECTED: [],
      CANCELLED: [],
      COMPLETED: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestError(`Invalid booking status transition from ${currentStatus} to ${targetStatus}.`);
    }
  }
}
