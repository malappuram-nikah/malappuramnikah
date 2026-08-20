import { BusinessRankingCalculator } from "../../domain/services/BusinessRankingCalculator";
import { BusinessProfileEntity } from "../../domain/entities/business.entity";

describe("Business Module - BusinessRankingCalculator Unit Tests", () => {
  it("should rank active businesses correctly and exclude suspended businesses", () => {
    const businesses: Partial<BusinessProfileEntity>[] = [
      { id: 1, average_rating: 4.5, total_reviews: 10, total_completed_bookings: 5, status: "ACTIVE" }, // score: (4.5*40)+(10*5)+(5*2) = 180+50+10 = 240
      { id: 2, average_rating: 4.8, total_reviews: 20, total_completed_bookings: 15, status: "ACTIVE" }, // score: (4.8*40)+(20*5)+(15*2) = 192+100+30 = 322
      { id: 3, average_rating: 5.0, total_reviews: 50, total_completed_bookings: 30, status: "SUSPENDED" }, // Excluded!
    ];

    const ranked = BusinessRankingCalculator.rankCategoryBusinesses(businesses as BusinessProfileEntity[]);
    expect(ranked.length).toBe(2);
    expect(ranked[0].business.id).toBe(2);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].business.id).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it("should perform deterministic tie-breaking for equal scores", () => {
    const businesses: Partial<BusinessProfileEntity>[] = [
      { id: 10, average_rating: 4.0, total_reviews: 10, total_completed_bookings: 5, status: "ACTIVE" },
      { id: 5, average_rating: 4.0, total_reviews: 10, total_completed_bookings: 5, status: "ACTIVE" },
    ];

    const ranked = BusinessRankingCalculator.rankCategoryBusinesses(businesses as BusinessProfileEntity[]);
    expect(ranked[0].business.id).toBe(5); // Lower ID wins tie-break deterministically
    expect(ranked[1].business.id).toBe(10);
  });
});
