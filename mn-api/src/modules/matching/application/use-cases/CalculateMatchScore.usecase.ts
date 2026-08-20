import { MatchingCalculator } from "../../domain/services/MatchingCalculator";
import { MatchScoreResult } from "../../domain/entities/matching.entity";
import { NotFoundError } from "../../../../shared/errors/AppError";
import prisma from "../../../../shared/database/prisma";

export class CalculateMatchScoreUseCase {
  async execute(requestingUserId: number, targetUserId: number): Promise<MatchScoreResult> {
    const [requestingUserPref, targetUserProfile] = await Promise.all([
      prisma.memberPreference.findUnique({ where: { user_id: requestingUserId } }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          member_profile: true,
          member_location: true,
          member_education: { take: 1 },
          member_occupation: { take: 1 },
        },
      }),
    ]);

    if (!targetUserProfile) {
      throw new NotFoundError("Target member profile not found.");
    }

    const profile = targetUserProfile.member_profile;
    const location = targetUserProfile.member_location;
    const education = targetUserProfile.member_education[0];
    const occupation = targetUserProfile.member_occupation[0];

    // Calculate age
    let age = 0;
    const dobStr = profile?.dob || targetUserProfile.dob;
    if (dobStr) {
      const dob = new Date(dobStr);
      if (!isNaN(dob.getTime())) {
        const now = new Date();
        age = now.getFullYear() - dob.getFullYear();
      }
    }

    const candidateContext = {
      age,
      heightCm: profile?.height_cm,
      maritalStatus: profile?.marital_status,
      district: location?.district,
      state: location?.state,
      highestEducation: education?.highest_education,
      profession: occupation?.profession,
    };

    const preferencesContext = {
      ageMin: requestingUserPref?.age_min,
      ageMax: requestingUserPref?.age_max,
      heightMin: requestingUserPref?.height_min,
      heightMax: requestingUserPref?.height_max,
      maritalStatusList: (requestingUserPref?.marital_status_list as string[]) || null,
      districtList: (requestingUserPref?.district_list as string[]) || null,
      educationList: (requestingUserPref?.education_list as string[]) || null,
      professionList: (requestingUserPref?.profession_list as string[]) || null,
    };

    return MatchingCalculator.calculateCompatibility(candidateContext, preferencesContext);
  }
}
