import { MatchingCalculator } from "../../domain/services/MatchingCalculator";

describe("Matching Module - Domain Service Unit Tests", () => {
  it("should return 100% overall score when candidate matches all preferences perfectly", () => {
    const candidate = {
      age: 25,
      heightCm: 170,
      maritalStatus: "Never Married",
      district: "Malappuram",
      state: "Kerala",
      highestEducation: "B.Tech Computer Science",
      profession: "Software Engineer",
    };

    const preferences = {
      ageMin: 20,
      ageMax: 30,
      heightMin: 160,
      heightMax: 180,
      maritalStatusList: ["Never Married"],
      districtList: ["Malappuram"],
      educationList: ["B.Tech"],
      professionList: ["Software Engineer"],
    };

    const score = MatchingCalculator.calculateCompatibility(candidate, preferences);

    expect(score.overallScore).toBe(100);
    expect(score.isCompatible).toBe(true);
    expect(score.breakdown.ageMatchScore).toBe(100);
    expect(score.breakdown.maritalStatusMatchScore).toBe(100);
  });

  it("should calculate partial score when candidate exceeds age range and location differs", () => {
    const candidate = {
      age: 35, // 5 years over ageMax 30 -> ageMatchScore = 100 - 5*20 = 0
      heightCm: 170,
      maritalStatus: "Never Married",
      district: "Ernakulam", // District doesn't match Malappuram -> 40
      state: "Kerala",
      highestEducation: "B.Com",
    };

    const preferences = {
      ageMin: 20,
      ageMax: 30,
      heightMin: 160,
      heightMax: 180,
      maritalStatusList: ["Never Married"],
      districtList: ["Malappuram"],
    };

    const score = MatchingCalculator.calculateCompatibility(candidate, preferences);

    expect(score.overallScore).toBeLessThan(70);
    expect(score.breakdown.ageMatchScore).toBe(0);
    expect(score.breakdown.locationMatchScore).toBe(40);
  });
});
