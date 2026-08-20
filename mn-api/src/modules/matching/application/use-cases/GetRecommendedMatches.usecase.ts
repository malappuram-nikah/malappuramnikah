import { ISearchRepository } from "../../../search/domain/repositories/ISearchRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";
import { MatchingCalculator } from "../../domain/services/MatchingCalculator";
import { CandidateMatch } from "../../domain/entities/matching.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";
import prisma from "../../../../shared/database/prisma";

export class GetRecommendedMatchesUseCase {
  constructor(
    private searchRepository: ISearchRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(requestingUserId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<CandidateMatch>> {
    // 1. Fetch requesting user profile & preferences
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      include: {
        member_profile: true,
        member_preference: true,
      },
    });

    const userGender = requestingUser?.member_profile?.gender || requestingUser?.gender;
    const targetGender = userGender ? (userGender.toLowerCase() === "female" ? "Male" : "Female") : undefined;

    // Exclude self and blocked users
    const blockedIds = await this.blockRepository.getBlockedUserIds(requestingUserId);
    const excludedUserIds = Array.from(new Set([requestingUserId, ...blockedIds]));

    // 2. Fetch candidates via database-optimized search query
    const searchResult = await this.searchRepository.searchProfiles(
      {
        gender: targetGender,
        page: 1,
        limit: 100, // Fetch top candidate pool for ranking
      },
      requestingUserId,
      excludedUserIds
    );

    const preferencesContext = {
      ageMin: requestingUser?.member_preference?.age_min,
      ageMax: requestingUser?.member_preference?.age_max,
      heightMin: requestingUser?.member_preference?.height_min,
      heightMax: requestingUser?.member_preference?.height_max,
      maritalStatusList: (requestingUser?.member_preference?.marital_status_list as string[]) || null,
      districtList: (requestingUser?.member_preference?.district_list as string[]) || null,
      educationList: (requestingUser?.member_preference?.education_list as string[]) || null,
      professionList: (requestingUser?.member_preference?.profession_list as string[]) || null,
    };

    // 3. Compute domain compatibility score for each candidate
    const rankedCandidates: CandidateMatch[] = searchResult.data.map((c) => {
      const candidateContext = {
        age: c.age,
        heightCm: c.height_cm,
        maritalStatus: c.marital_status,
        district: c.district,
        state: c.state,
        highestEducation: c.highest_education,
        profession: c.profession,
      };

      const matchScore = MatchingCalculator.calculateCompatibility(candidateContext, preferencesContext);

      return {
        userId: c.user_id,
        firstName: c.first_name,
        lastName: c.last_name,
        gender: c.gender,
        age: c.age,
        district: c.district,
        heightCm: c.height_cm,
        maritalStatus: c.marital_status,
        profession: c.profession,
        photoUrl: c.photo_url,
        matchScore,
      };
    });

    // Sort by overall match score descending
    rankedCandidates.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);

    // Apply pagination to ranked candidate list
    const skip = (page - 1) * limit;
    const paginatedData = rankedCandidates.slice(skip, skip + limit);
    const total = rankedCandidates.length;

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
