export interface ProfileSectionsData {
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    dob?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    about_me?: string | null;
  } | null;
  location?: {
    country?: string | null;
    state?: string | null;
    district?: string | null;
    city?: string | null;
  } | null;
  education?: Array<{ highest_education?: string | null }> | null;
  occupation?: Array<{ profession?: string | null; annual_income?: string | null }> | null;
  family?: {
    family_status?: string | null;
    father_name?: string | null;
    mother_name?: string | null;
  } | null;
  preference?: {
    age_min?: number | null;
    age_max?: number | null;
    district_list?: any;
  } | null;
  media?: Array<{ url: string; is_primary?: boolean }> | null;
}

export class ProfileCompletionCalculator {
  static calculateScore(data: ProfileSectionsData): { totalScore: number; breakDown: Record<string, number> } {
    let basicScore = 0;
    if (data.profile) {
      if (data.profile.first_name) basicScore += 5;
      if (data.profile.last_name) basicScore += 5;
      if (data.profile.dob) basicScore += 5;
      if (data.profile.marital_status) basicScore += 5;
    }

    let locationScore = 0;
    if (data.location) {
      if (data.location.district) locationScore += 10;
      if (data.location.state) locationScore += 5;
    }

    let eduOccScore = 0;
    if (data.education && data.education.length > 0 && data.education[0].highest_education) {
      eduOccScore += 10;
    }
    if (data.occupation && data.occupation.length > 0 && data.occupation[0].profession) {
      eduOccScore += 10;
    }

    let familyScore = 0;
    if (data.family) {
      if (data.family.family_status) familyScore += 5;
      if (data.family.father_name || data.family.mother_name) familyScore += 10;
    }

    let preferenceScore = 0;
    if (data.preference) {
      if (data.preference.age_min || data.preference.age_max) preferenceScore += 10;
      if (data.preference.district_list) preferenceScore += 5;
    }

    let mediaScore = 0;
    if (data.media && data.media.length > 0) {
      mediaScore = 15;
    }

    const totalScore = basicScore + locationScore + eduOccScore + familyScore + preferenceScore + mediaScore;

    return {
      totalScore: Math.min(100, totalScore),
      breakDown: {
        basic: basicScore,
        location: locationScore,
        education_occupation: eduOccScore,
        family: familyScore,
        preference: preferenceScore,
        media: mediaScore,
      },
    };
  }
}
