import { RatingCalculator } from "../../domain/services/RatingCalculator";
import { BusinessReviewEntity } from "../../domain/entities/business.entity";

describe("Business Module - RatingCalculator Unit Tests", () => {
  it("should calculate correct average rating and total review count", () => {
    const reviews: Partial<BusinessReviewEntity>[] = [
      { rating: 5, status: "APPROVED" },
      { rating: 4, status: "APPROVED" },
      { rating: 3, status: "APPROVED" },
      { rating: 1, status: "PENDING" }, // Ignored
    ];

    const result = RatingCalculator.calculate(reviews as BusinessReviewEntity[]);
    expect(result.totalReviews).toBe(3);
    expect(result.averageRating).toBe(4.0);
  });

  it("should return 0 rating and count for empty reviews list", () => {
    const result = RatingCalculator.calculate([]);
    expect(result.totalReviews).toBe(0);
    expect(result.averageRating).toBe(0);
  });
});
