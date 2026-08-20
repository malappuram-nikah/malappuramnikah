import { BusinessValidator } from "../../domain/services/BusinessValidator";
import { BusinessProfileEntity, BusinessBookingEntity } from "../../domain/entities/business.entity";

describe("Business Module - BusinessValidator Unit Tests", () => {
  it("should throw ForbiddenError if user does not own business profile", () => {
    const profile: Partial<BusinessProfileEntity> = { user_id: 100 };
    expect(() => BusinessValidator.validateOwnership(99, profile as BusinessProfileEntity)).toThrow(
      "Unauthorized: You are not the owner of this business profile."
    );
  });

  it("should throw BadRequestError if offer end date is before start date", () => {
    const from = new Date("2026-10-10");
    const to = new Date("2026-10-01");
    expect(() => BusinessValidator.validateOfferDates(from, to)).toThrow(
      "Offer validity end date must be after the start date."
    );
  });

  it("should throw ForbiddenError if user attempts to review uncompleted booking", () => {
    const booking: Partial<BusinessBookingEntity> = {
      customer_id: 5,
      business_id: 10,
      status: "PENDING",
    };
    expect(() => BusinessValidator.validateReviewEligibility(booking as BusinessBookingEntity, 5, 10)).toThrow(
      "Reviews can only be submitted for COMPLETED bookings."
    );
  });
});
