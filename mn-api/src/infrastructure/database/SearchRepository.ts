import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  // Premium filters
  familyStatus?: string[];
  prayer?: string;
  hijab?: string;
  beard?: string;
  isPremiumUser: boolean;
}

export class SearchRepository {
  async searchProfiles(filters: SearchFilters, currentUserId: number) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Exclude current user
    whereClauses.push(`u.id != $${paramIndex++}`);
    values.push(currentUserId);

    // Filter opposite gender
    if (filters.gender) {
      whereClauses.push(`LOWER(u.gender) = LOWER($${paramIndex++})`);
      values.push(filters.gender);
    }

    // Active profiles only
    whereClauses.push(`u.status = 'active'`);

    // Basic Filters (Direct DB Columns)
    if (filters.verified) {
      whereClauses.push(`u.kyc_status = 'VERIFIED'`);
    }

    if (filters.community && filters.community.length > 0) {
      const placeholders = filters.community.map(() => `$${paramIndex++}`).join(", ");
      whereClauses.push(`u.cast IN (${placeholders})`);
      values.push(...filters.community);
    }

    // JSON Filters (profile_details)
    // Age
    if (filters.ageMin !== undefined) {
      whereClauses.push(`CAST(u.profile_details->'mn_basic_details_draft'->>'age' AS INTEGER) >= $${paramIndex++}`);
      values.push(filters.ageMin);
    }
    if (filters.ageMax !== undefined) {
      whereClauses.push(`CAST(u.profile_details->'mn_basic_details_draft'->>'age' AS INTEGER) <= $${paramIndex++}`);
      values.push(filters.ageMax);
    }

    // Height
    if (filters.heightMin !== undefined) {
      whereClauses.push(`CAST(u.profile_details->'mn_basic_details_draft'->>'height' AS INTEGER) >= $${paramIndex++}`);
      values.push(filters.heightMin);
    }
    if (filters.heightMax !== undefined) {
      whereClauses.push(`CAST(u.profile_details->'mn_basic_details_draft'->>'height' AS INTEGER) <= $${paramIndex++}`);
      values.push(filters.heightMax);
    }

    // Marital Status
    if (filters.maritalStatus && filters.maritalStatus.length > 0) {
      const placeholders = filters.maritalStatus.map(() => `$${paramIndex++}`).join(", ");
      whereClauses.push(`u.profile_details->'mn_basic_details_draft'->>'maritalStatus' IN (${placeholders})`);
      values.push(...filters.maritalStatus);
    }

    // District
    if (filters.district && filters.district.length > 0) {
      const placeholders = filters.district.map(() => `$${paramIndex++}`).join(", ");
      whereClauses.push(`u.profile_details->'mn_basic_details_draft'->>'location' IN (${placeholders})`);
      values.push(...filters.district);
    }

    // Education
    if (filters.education && filters.education.length > 0) {
      const placeholders = filters.education.map(() => `$${paramIndex++}`).join(", ");
      whereClauses.push(`u.profile_details->'mn_professional_info_draft'->>'highestEducation' IN (${placeholders})`);
      values.push(...filters.education);
    }

    // Profession
    if (filters.profession && filters.profession.length > 0) {
      const placeholders = filters.profession.map(() => `$${paramIndex++}`).join(", ");
      whereClauses.push(`u.profile_details->'mn_professional_info_draft'->>'profession' IN (${placeholders})`);
      values.push(...filters.profession);
    }

    // Premium Filters
    if (filters.isPremiumUser) {
      if (filters.familyStatus && filters.familyStatus.length > 0) {
        const placeholders = filters.familyStatus.map(() => `$${paramIndex++}`).join(", ");
        whereClauses.push(`u.profile_details->'mn_family_details_draft'->>'familyStatus' IN (${placeholders})`);
        values.push(...filters.familyStatus);
      }
      if (filters.prayer) {
        whereClauses.push(`u.profile_details->'mn_religious_info_draft'->>'namaz' = $${paramIndex++}`);
        values.push(filters.prayer);
      }
      if (filters.hijab) {
        whereClauses.push(`u.profile_details->'mn_religious_info_draft'->>'hijab' = $${paramIndex++}`);
        values.push(filters.hijab);
      }
      if (filters.beard) {
        whereClauses.push(`u.profile_details->'mn_religious_info_draft'->>'beard' = $${paramIndex++}`);
        values.push(filters.beard);
      }
    }

    // Sorting
    let orderByClause = `ORDER BY u.created_at DESC`;
    if (filters.sortBy === "recently_active") {
      orderByClause = `ORDER BY u.last_login DESC NULLS LAST, u.created_at DESC`;
    } else if (filters.sortBy === "premium_first") {
      orderByClause = `ORDER BY u.is_premium DESC, u.created_at DESC`;
    } else if (filters.sortBy === "age_asc") {
      orderByClause = `ORDER BY CAST(u.profile_details->'mn_basic_details_draft'->>'age' AS INTEGER) ASC NULLS LAST`;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT u.id, u.first_name, u.last_name, u.gender, u.cast, u.location, 
             u.status, u.is_premium, u.kyc_status, u.last_login, u.profile_details, u.created_at
      FROM "user" u
      ${whereString}
      ${orderByClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM "user" u
      ${whereString}
    `;

    const countValues = values.slice(0, values.length - 2); // Exclude LIMIT and OFFSET

    try {
      const [users, totalResult] = await Promise.all([
        prisma.$queryRawUnsafe(query, ...values) as Promise<any[]>,
        prisma.$queryRawUnsafe(countQuery, ...countValues) as Promise<any[]>
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
