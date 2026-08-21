import { Prisma } from "@prisma/client";
import prisma from "../prisma/prisamClient";

export interface SearchFilters {
  page?: number;
  limit?: number;
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  gender?: string;
  country?: string[];
  state?: string[];
  district?: string[];
  education?: string[];
  profession?: string[];
  maritalStatus?: string[];
  community?: string[];
  verified?: boolean;
  photo?: boolean;
  online?: boolean;
  keyword?: string;
  sortBy?: string;
  // New basic filters
  recentLogin?: boolean;
  recentRegistration?: boolean;
  hideViewed?: boolean;
  hideInterested?: boolean;
  // Premium filters
  familyStatus?: string[];
  financialStatus?: string[];
  professionType?: string[];
  bodyType?: string[];
  ethnicity?: string[];
  eatingHabits?: string[];
  drinkingHabits?: string[];
  religiousness?: string[];
  prayer?: string;
  hijab?: string;
  beard?: string;
  isPremiumUser: boolean;
  lightweight?: boolean;
}

export class SearchRepository {
  async searchProfiles(filters: SearchFilters, currentUserId: number) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: Prisma.Sql[] = [];

    // Exclude current user
    conditions.push(Prisma.sql`u.id != ${currentUserId}`);

    // Active profiles only
    conditions.push(Prisma.sql`u.status = 'active'`);

    // Filter opposite gender
    if (filters.gender) {
      conditions.push(Prisma.sql`LOWER(u.gender) = LOWER(${filters.gender})`);
    }

    // Basic Filters (Direct DB Columns)
    if (filters.verified) {
      conditions.push(Prisma.sql`u.kyc_status = 'VERIFIED'`);
    }

    if (filters.photo) {
      conditions.push(Prisma.sql`
        u.profile_details->'mn_profile_photos_draft'->'photos' IS NOT NULL 
        AND jsonb_typeof(u.profile_details->'mn_profile_photos_draft'->'photos') = 'array'
        AND jsonb_array_length(u.profile_details->'mn_profile_photos_draft'->'photos') > 0
      `);
    }

    if (filters.community && filters.community.length > 0) {
      conditions.push(Prisma.sql`u.cast IN (${Prisma.join(filters.community)})`);
    }

    if (filters.recentLogin) {
      conditions.push(Prisma.sql`u.last_login >= NOW() - INTERVAL '7 days'`);
    }

    if (filters.recentRegistration) {
      conditions.push(Prisma.sql`u.created_at >= NOW() - INTERVAL '7 days'`);
    }

    if (filters.hideInterested) {
      conditions.push(Prisma.sql`NOT EXISTS (
        SELECT 1 FROM "interest" i 
        WHERE i.receiver_id = u.id AND i.sender_id = ${currentUserId}
      )`);
    }

    if (filters.hideViewed) {
      conditions.push(Prisma.sql`NOT EXISTS (
        SELECT 1 FROM "profile_view" pv 
        WHERE pv.viewed_id = u.id AND pv.viewer_id = ${currentUserId}
      )`);
    }

    // JSON Filters (profile_details)
    // Age
    if (filters.ageMin !== undefined) {
      conditions.push(Prisma.sql`CAST(u.profile_details->'mn_basic_details_draft'->>'age' AS INTEGER) >= ${filters.ageMin}`);
    }
    if (filters.ageMax !== undefined) {
      conditions.push(Prisma.sql`CAST(u.profile_details->'mn_basic_details_draft'->>'age' AS INTEGER) <= ${filters.ageMax}`);
    }

    // Height
    if (filters.heightMin !== undefined) {
      conditions.push(Prisma.sql`CAST(u.profile_details->'mn_basic_details_draft'->>'height' AS INTEGER) >= ${filters.heightMin}`);
    }
    if (filters.heightMax !== undefined) {
      conditions.push(Prisma.sql`CAST(u.profile_details->'mn_basic_details_draft'->>'height' AS INTEGER) <= ${filters.heightMax}`);
    }

    // Marital Status
    if (filters.maritalStatus && filters.maritalStatus.length > 0) {
      conditions.push(Prisma.sql`u.profile_details->'mn_basic_details_draft'->>'maritalStatus' IN (${Prisma.join(filters.maritalStatus)})`);
    }

    // District / Location filter
    if (filters.district && filters.district.length > 0) {
      const lowerLocations = filters.district.map(loc => loc.toLowerCase());
      conditions.push(Prisma.sql`(LOWER(u.location) IN (${Prisma.join(lowerLocations)}) OR LOWER(u.profile_details->'mn_basic_details_draft'->>'location') IN (${Prisma.join(lowerLocations)}))`);
    }

    // Education
    if (filters.education && filters.education.length > 0) {
      conditions.push(Prisma.sql`u.profile_details->'mn_professional_info_draft'->>'highestEducation' IN (${Prisma.join(filters.education)})`);
    }

    // Profession
    if (filters.profession && filters.profession.length > 0) {
      conditions.push(Prisma.sql`u.profile_details->'mn_professional_info_draft'->>'profession' IN (${Prisma.join(filters.profession)})`);
    }

    // Premium Filters
    if (filters.isPremiumUser) {
      if (filters.familyStatus && filters.familyStatus.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_family_details_draft'->>'familyStatus' IN (${Prisma.join(filters.familyStatus)})`);
      }
      if (filters.financialStatus && filters.financialStatus.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_family_details_draft'->>'financialStatus' IN (${Prisma.join(filters.financialStatus)})`);
      }
      if (filters.professionType && filters.professionType.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_professional_info_draft'->>'professionType' IN (${Prisma.join(filters.professionType)})`);
      }
      if (filters.bodyType && filters.bodyType.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_basic_details_draft'->>'bodyType' IN (${Prisma.join(filters.bodyType)})`);
      }
      if (filters.ethnicity && filters.ethnicity.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_religious_info_draft'->>'ethnicity' IN (${Prisma.join(filters.ethnicity)})`);
      }
      if (filters.eatingHabits && filters.eatingHabits.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_basic_details_draft'->>'eatingHabits' IN (${Prisma.join(filters.eatingHabits)})`);
      }
      if (filters.drinkingHabits && filters.drinkingHabits.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_basic_details_draft'->>'drinkingHabits' IN (${Prisma.join(filters.drinkingHabits)})`);
      }
      if (filters.religiousness && filters.religiousness.length > 0) {
        conditions.push(Prisma.sql`u.profile_details->'mn_religious_info_draft'->>'religiousness' IN (${Prisma.join(filters.religiousness)})`);
      }
      if (filters.prayer) {
        conditions.push(Prisma.sql`u.profile_details->'mn_religious_info_draft'->>'namaz' = ${filters.prayer}`);
      }
      if (filters.hijab) {
        conditions.push(Prisma.sql`u.profile_details->'mn_religious_info_draft'->>'hijab' = ${filters.hijab}`);
      }
      if (filters.beard) {
        conditions.push(Prisma.sql`u.profile_details->'mn_religious_info_draft'->>'beard' = ${filters.beard}`);
      }
    }

    const whereClause = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

    // Sorting
    let orderByClause = Prisma.sql`ORDER BY u.created_at DESC`;
    if (filters.sortBy === "recently_active") {
      orderByClause = Prisma.sql`ORDER BY u.last_login DESC NULLS LAST, u.created_at DESC`;
    } else if (filters.sortBy === "premium_first") {
      orderByClause = Prisma.sql`ORDER BY u.is_premium DESC, u.created_at DESC`;
    } else if (filters.sortBy === "age_asc") {
      orderByClause = Prisma.sql`ORDER BY CAST(u.profile_details->'mn_basic_details_draft'->>'age' AS INTEGER) ASC NULLS LAST`;
    }

    let profileDetailsSelect = Prisma.sql`u.profile_details`;
    if (filters.lightweight) {
      profileDetailsSelect = Prisma.sql`
        jsonb_build_object(
          'mn_basic_details_draft', u.profile_details->'mn_basic_details_draft',
          'mn_profile_photos_draft', u.profile_details->'mn_profile_photos_draft',
          'mn_career_details_draft', u.profile_details->'mn_career_details_draft',
          'mn_religious_info_draft', u.profile_details->'mn_religious_info_draft'
        ) as profile_details
      `;
    }

    const query = Prisma.sql`
      SELECT u.id, u.first_name, u.last_name, u.gender, u.cast, u.location, 
             u.status, u.is_premium, u.kyc_status, u.last_login, ${profileDetailsSelect}, u.created_at
      FROM "user" u
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*) as total
      FROM "user" u
      ${whereClause}
    `;

    try {
      const [users, totalResult] = await Promise.all([
        prisma.$queryRaw(query) as Promise<any[]>,
        prisma.$queryRaw(countQuery) as Promise<any[]>
      ]);

      const total = Number(totalResult[0]?.total || 0);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          hasNext: offset + users.length < total
        }
      };
    } catch (error) {
      console.error("SearchRepository DB Error:", error);
      throw new Error("Failed to execute search query");
    }
  }

  async updateSearchPreferences(userId: number, preferences: any) {
    return prisma.user.update({
      where: { id: userId },
      data: { search_preferences: preferences }
    });
  }
}
