export interface MatchScoreBreakdown {
  ageMatchScore: number;
  heightMatchScore: number;
  locationMatchScore: number;
  maritalStatusMatchScore: number;
  educationProfessionMatchScore: number;
}

export interface MatchScoreResult {
  overallScore: number; // 0 to 100
  percentage: number;
  breakdown: MatchScoreBreakdown;
  isCompatible: boolean;
}

export interface CandidateMatch {
  userId: number;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  district?: string | null;
  heightCm?: number | null;
  maritalStatus?: string | null;
  profession?: string | null;
  photoUrl?: string | null;
  matchScore: MatchScoreResult;
}
