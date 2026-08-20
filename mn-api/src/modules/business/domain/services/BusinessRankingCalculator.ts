import { BusinessProfileEntity } from "../entities/business.entity";

export interface RankedBusinessItem {
  business: BusinessProfileEntity;
  score: number;
  rank: number;
}

export class BusinessRankingCalculator {
  static calculateScore(business: BusinessProfileEntity): number {
    if (business.status !== "ACTIVE") {
      return 0.0;
    }

    const ratingWeight = 40;
    const reviewWeight = 5;
    const bookingWeight = 2;

    const ratingScore = (business.average_rating || 0) * ratingWeight;
    const reviewScore = (business.total_reviews || 0) * reviewWeight;
    const bookingScore = (business.total_completed_bookings || 0) * bookingWeight;

    return Number((ratingScore + reviewScore + bookingScore).toFixed(2));
  }

  static rankCategoryBusinesses(businesses: BusinessProfileEntity[]): RankedBusinessItem[] {
    // 1. Exclude suspended/inactive businesses
    const activeBusinesses = businesses.filter((b) => b.status === "ACTIVE");

    // 2. Compute score for each business
    const scoredList = activeBusinesses.map((b) => ({
      business: b,
      score: this.calculateScore(b),
    }));

    // 3. Sort by score DESC, then total_completed_bookings DESC, then ID ASC for deterministic tie-breaking
    scoredList.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.business.total_completed_bookings !== a.business.total_completed_bookings) {
        return b.business.total_completed_bookings - a.business.total_completed_bookings;
      }
      return a.business.id - b.business.id;
    });

    // 4. Assign rank index (1-based)
    return scoredList.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }
}
