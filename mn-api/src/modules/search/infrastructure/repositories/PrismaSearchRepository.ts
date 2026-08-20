import { ISearchRepository } from "../../domain/repositories/ISearchRepository";
import { SearchCriteria, SearchResultItem } from "../../domain/entities/search-criteria.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";
import prisma from "../../../../shared/database/prisma";

export class PrismaSearchRepository implements ISearchRepository {
  async searchProfiles(
    criteria: SearchCriteria,
    requestingUserId?: number,
    excludedUserIds: number[] = []
  ): Promise<PaginatedResult<SearchResultItem>> {
    const page = criteria.page && criteria.page > 0 ? criteria.page : 1;
    const limit = criteria.limit && criteria.limit > 0 ? criteria.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: "ACTIVE", // Business rule: Only active profiles are visible
    };

    if (excludedUserIds.length > 0) {
      where.id = { notIn: excludedUserIds };
    }

    // Gender filter
    if (criteria.gender) {
      where.gender = { equals: criteria.gender, mode: "insensitive" };
    }

    // MemberProfile relational filters
    const profileWhere: any = {};
    if (criteria.maritalStatus) {
      profileWhere.marital_status = { equals: criteria.maritalStatus, mode: "insensitive" };
    }
    if (criteria.minHeightCm || criteria.maxHeightCm) {
      profileWhere.height_cm = {};
      if (criteria.minHeightCm) profileWhere.height_cm.gte = criteria.minHeightCm;
      if (criteria.maxHeightCm) profileWhere.height_cm.lte = criteria.maxHeightCm;
    }
    if (criteria.motherTongue) {
      profileWhere.mother_tongue = { equals: criteria.motherTongue, mode: "insensitive" };
    }

    if (Object.keys(profileWhere).length > 0) {
      where.member_profile = profileWhere;
    }

    // Location relational filters
    const locationWhere: any = {};
    if (criteria.district) {
      locationWhere.district = { equals: criteria.district, mode: "insensitive" };
    }
    if (criteria.state) {
      locationWhere.state = { equals: criteria.state, mode: "insensitive" };
    }
    if (criteria.country) {
      locationWhere.country = { equals: criteria.country, mode: "insensitive" };
    }

    if (Object.keys(locationWhere).length > 0) {
      where.member_location = locationWhere;
    }

    // Education relational filter
    if (criteria.highestEducation) {
      where.member_education = {
        some: {
          highest_education: { contains: criteria.highestEducation, mode: "insensitive" },
        },
      };
    }

    // Occupation relational filter
    if (criteria.profession) {
      where.member_occupation = {
        some: {
          profession: { contains: criteria.profession, mode: "insensitive" },
        },
      };
    }

    // Execute optimized query count + pagination
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: criteria.sortBy === "created_at" ? { created_at: criteria.sortOrder || "desc" } : { id: "desc" },
        include: {
          member_profile: true,
          member_location: true,
          member_education: { take: 1 },
          member_occupation: { take: 1 },
          member_media: { where: { is_primary: true }, take: 1 },
        },
      }),
    ]);

    // Map database results to SearchResultItem and calculate age
    const now = new Date();
    const data: SearchResultItem[] = users
      .map((u) => {
        const profile = u.member_profile;
        const location = u.member_location;
        const education = u.member_education[0];
        const occupation = u.member_occupation[0];
        const primaryMedia = u.member_media[0];

        // Age calculation from DOB
        let age = 0;
        const dobStr = profile?.dob || u.dob;
        if (dobStr) {
          const dob = new Date(dobStr);
          if (!isNaN(dob.getTime())) {
            age = now.getFullYear() - dob.getFullYear();
            const monthDiff = now.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
              age--;
            }
          }
        }

        return {
          id: u.id,
          user_id: u.id,
          first_name: profile?.first_name || u.first_name || "",
          last_name: profile?.last_name || u.last_name || "",
          gender: profile?.gender || u.gender,
          dob: dobStr,
          age,
          marital_status: profile?.marital_status,
          height_cm: profile?.height_cm,
          weight_kg: profile?.weight_kg,
          mother_tongue: profile?.mother_tongue,
          about_me: profile?.about_me,
          district: location?.district,
          state: location?.state,
          country: location?.country,
          highest_education: education?.highest_education,
          profession: occupation?.profession,
          photo_url: primaryMedia?.url || null,
          created_at: u.created_at,
        };
      })
      // Apply post-fetch age filter if criteria specifies minAge/maxAge
      .filter((item) => {
        if (criteria.minAge && item.age < criteria.minAge) return false;
        if (criteria.maxAge && item.age > criteria.maxAge) return false;
        return true;
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
