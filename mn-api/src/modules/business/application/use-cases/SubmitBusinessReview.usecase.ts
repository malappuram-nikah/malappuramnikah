import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessReviewEntity } from "../../domain/entities/business.entity";
import { BusinessValidator } from "../../domain/services/BusinessValidator";
import { RatingCalculator } from "../../domain/services/RatingCalculator";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export interface SubmitReviewDTO {
  userId: number;
  businessId: number;
  bookingId: number;
  rating: number;
  subject?: string;
  comment?: string;
}

export class SubmitBusinessReviewUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(dto: SubmitReviewDTO): Promise<BusinessReviewEntity> {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestError("Rating must be an integer between 1 and 5.");
    }

    const booking = await this.businessRepository.findBookingById(dto.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking record not found.");
    }

    // Backend ownership and booking relationship validation
    BusinessValidator.validateReviewEligibility(booking, dto.userId, dto.businessId);

    // Prevent duplicate review for the same completed booking
    const existingReview = await this.businessRepository.findReviewByBookingId(dto.bookingId);
    if (existingReview) {
      throw new BadRequestError("You have already submitted a review for this completed booking.");
    }

    // Create review
    const review = await this.businessRepository.createReview({
      business_id: dto.businessId,
      user_id: dto.userId,
      booking_id: dto.bookingId,
      rating: Math.round(dto.rating),
      subject: dto.subject,
      comment: dto.comment,
    });

    // Recompute business average rating & review count from database
    const allReviews = await this.businessRepository.getBusinessReviews(dto.businessId);
    const ratingStats = RatingCalculator.calculate(allReviews);

    const profile = await this.businessRepository.findProfileById(dto.businessId);
    if (profile) {
      await this.businessRepository.updateBusinessStats(
        dto.businessId,
        ratingStats.averageRating,
        ratingStats.totalReviews,
        profile.total_completed_bookings
      );
    }

    return review;
  }
}
