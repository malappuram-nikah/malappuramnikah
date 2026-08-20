import { BusinessReviewEntity } from "../entities/business.entity";

export interface RatingResult {
  averageRating: number;
  totalReviews: number;
}

export class RatingCalculator {
  static calculate(reviews: BusinessReviewEntity[]): RatingResult {
    const validReviews = reviews.filter((r) => r.status === "APPROVED");
    const totalReviews = validReviews.length;

    if (totalReviews === 0) {
      return { averageRating: 0.0, totalReviews: 0 };
    }

    const sum = validReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Number((sum / totalReviews).toFixed(1));

    return { averageRating, totalReviews };
  }
}
