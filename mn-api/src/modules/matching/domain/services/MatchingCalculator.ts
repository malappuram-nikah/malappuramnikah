import { MatchScoreResult, MatchScoreBreakdown } from "../entities/matching.entity";

export interface ProfileAttributeContext {
  age?: number;
  heightCm?: number | null;
  maritalStatus?: string | null;
  district?: string | null;
  state?: string | null;
  highestEducation?: string | null;
  profession?: string | null;
}

export interface PreferencesContext {
  ageMin?: number | null;
  ageMax?: number | null;
  heightMin?: number | null;
  heightMax?: number | null;
  maritalStatusList?: string[] | null;
  districtList?: string[] | null;
  educationList?: string[] | null;
  professionList?: string[] | null;
}

export class MatchingCalculator {
  static calculateCompatibility(
    candidate: ProfileAttributeContext,
    preferences: PreferencesContext
  ): MatchScoreResult {
    let ageMatchScore = 100;
    let heightMatchScore = 100;
    let locationMatchScore = 70; // Default base location score
    let maritalStatusMatchScore = 100;
    let educationProfessionMatchScore = 70;

    // 1. Age Compatibility (Weight: 25%)
    if (candidate.age && (preferences.ageMin || preferences.ageMax)) {
      const min = preferences.ageMin || 18;
      const max = preferences.ageMax || 60;
      if (candidate.age >= min && candidate.age <= max) {
        ageMatchScore = 100;
      } else {
        const diff = candidate.age < min ? min - candidate.age : candidate.age - max;
        ageMatchScore = Math.max(0, 100 - diff * 20);
      }
    }

    // 2. Height Compatibility (Weight: 20%)
    if (candidate.heightCm && (preferences.heightMin || preferences.heightMax)) {
      const min = preferences.heightMin || 140;
      const max = preferences.heightMax || 210;
      if (candidate.heightCm >= min && candidate.heightCm <= max) {
        heightMatchScore = 100;
      } else {
        const diff = candidate.heightCm < min ? min - candidate.heightCm : candidate.heightCm - max;
        heightMatchScore = Math.max(0, 100 - diff * 10);
      }
    }

    // 3. Location / District Compatibility (Weight: 25%)
    if (candidate.district && preferences.districtList && preferences.districtList.length > 0) {
      const match = preferences.districtList.some(
        (d) => d.toLowerCase() === candidate.district?.toLowerCase()
      );
      locationMatchScore = match ? 100 : 40;
    }

    // 4. Marital Status Compatibility (Weight: 15%)
    if (candidate.maritalStatus && preferences.maritalStatusList && preferences.maritalStatusList.length > 0) {
      const match = preferences.maritalStatusList.some(
        (m) => m.toLowerCase() === candidate.maritalStatus?.toLowerCase()
      );
      maritalStatusMatchScore = match ? 100 : 0;
    }

    // 5. Education & Profession Compatibility (Weight: 15%)
    if (candidate.highestEducation && preferences.educationList && preferences.educationList.length > 0) {
      const eduMatch = preferences.educationList.some((e) =>
        candidate.highestEducation?.toLowerCase().includes(e.toLowerCase())
      );
      if (eduMatch) educationProfessionMatchScore = 100;
    }

    const breakdown: MatchScoreBreakdown = {
      ageMatchScore,
      heightMatchScore,
      locationMatchScore,
      maritalStatusMatchScore,
      educationProfessionMatchScore,
    };

    // Calculate weighted overall score
    const weightedSum =
      ageMatchScore * 0.25 +
      heightMatchScore * 0.2 +
      locationMatchScore * 0.25 +
      maritalStatusMatchScore * 0.15 +
      educationProfessionMatchScore * 0.15;

    const overallScore = Math.round(weightedSum);

    return {
      overallScore,
      percentage: overallScore,
      breakdown,
      isCompatible: overallScore >= 60,
    };
  }
}
