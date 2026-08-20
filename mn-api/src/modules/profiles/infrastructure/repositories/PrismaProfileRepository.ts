import { IProfileRepository, FullProfileResult, GetProfilesOptions, PublicStats } from "../../domain/repositories/IProfileRepository";
import { ProfileEntity } from "../../domain/entities/profile.entity";
import { ProfileCompletionCalculator } from "../../domain/services/ProfileCompletionCalculator";
import { prisma, runInTransaction } from "../../../../infrastructure/database/prisma.service";

export class PrismaProfileRepository implements IProfileRepository {
  async findById(id: number | string): Promise<ProfileEntity | null> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    if (isNaN(numericId)) return null;

    const user = await prisma.user.findUnique({
      where: { id: numericId },
    });
    return user ? (user as unknown as ProfileEntity) : null;
  }

  async findProfiles(options: GetProfilesOptions): Promise<ProfileEntity[]> {
    const where: any = { status: "active" };

    if (options.gender) {
      where.gender = { equals: options.gender, mode: "insensitive" };
    }
    if (options.ids && options.ids.length > 0) {
      where.id = { in: options.ids };
    }

    const select = options.lightweight
      ? {
          id: true,
          first_name: true,
          last_name: true,
          gender: true,
          cast: true,
          location: true,
          dob: true,
          status: true,
          is_premium: true,
          kyc_status: true,
          last_login: true,
          created_at: true,
          updated_at: true,
          profile_for: true,
          mobile_number: true,
          referral_points: true,
          profile_details: true,
        }
      : undefined;

    const users = await prisma.user.findMany({
      where,
      take: options.limit,
      orderBy: { id: "desc" },
      select: select as any,
    });

    return users as unknown as ProfileEntity[];
  }

  async updateProfile(id: number, details: Record<string, any>, coreFields: Record<string, any> = {}): Promise<ProfileEntity> {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        profile_details: details,
        ...coreFields,
      },
    });
    return updated as unknown as ProfileEntity;
  }

  async deleteUser(id: number): Promise<void> {
    await runInTransaction(async (tx) => {
      await tx.verify.deleteMany({ where: { user_id: id } });
      await tx.interest.deleteMany({
        where: { OR: [{ sender_id: id }, { receiver_id: id }] },
      });
      await tx.message.deleteMany({
        where: { OR: [{ sender_id: id }, { receiver_id: id }] },
      });
      await tx.notification.deleteMany({
        where: { OR: [{ user_id: id }, { sender_id: id }] },
      });
      await tx.user.delete({ where: { id } });
    });
  }

  async getPublicStats(): Promise<PublicStats> {
    const [totalUsers, activeUsers, verifiedUsers, acceptedMatches] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { kyc_status: "VERIFIED" } }),
      prisma.interest.count({ where: { status: "ACCEPTED" } }),
    ]);

    let verifiedPercentage = 98;
    if (totalUsers > 0) {
      const verifiedOrActive = Math.max(activeUsers, verifiedUsers);
      verifiedPercentage = Math.min(100, Math.max(80, Math.round((verifiedOrActive / totalUsers) * 100)));
    }

    const earliestUser = await prisma.user.findFirst({
      orderBy: { created_at: "asc" },
      select: { created_at: true },
    });

    let yearsOfTrust = 1;
    if (earliestUser) {
      const createdYear = new Date(earliestUser.created_at).getFullYear();
      const currentYear = new Date().getFullYear();
      yearsOfTrust = Math.max(1, currentYear - createdYear + 1);
    }

    return {
      registeredMembers: totalUsers,
      happyMarriages: acceptedMatches,
      verifiedPercentage,
      yearsOfTrust,
    };
  }

  async getFullProfile(userId: number): Promise<FullProfileResult | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        member_profile: true,
        member_location: true,
        member_education: true,
        member_occupation: true,
        member_family: true,
        member_preference: true,
        member_privacy: true,
        member_media: true,
      },
    });

    if (!user) return null;

    const sectionsData = {
      profile: user.member_profile || {
        first_name: user.first_name,
        last_name: user.last_name,
        dob: user.dob,
        gender: user.gender,
      },
      location: user.member_location || { district: user.location },
      education: user.member_education,
      occupation: user.member_occupation,
      family: user.member_family,
      preference: user.member_preference,
      media: user.member_media,
    };

    const completion = ProfileCompletionCalculator.calculateScore(sectionsData);

    return {
      userId: user.id,
      userUuid: user.uuid,
      mobileNumber: user.mobile_number,
      email: user.email,
      status: user.status,
      isPremium: user.is_premium,
      isNewUser: user.is_new_user,
      kycStatus: user.kyc_status,
      completionScore: completion.totalScore,
      completionBreakdown: completion.breakDown,
      profile: sectionsData.profile,
      location: sectionsData.location,
      education: user.member_education,
      occupation: user.member_occupation,
      family: user.member_family,
      preference: user.member_preference,
      privacy: user.member_privacy,
      media: user.member_media,
    };
  }

  async updateBasicDetails(userId: number, data: any): Promise<void> {
    await prisma.memberProfile.upsert({
      where: { user_id: userId },
      update: {
        first_name: data.first_name,
        last_name: data.last_name,
        dob: data.dob,
        marital_status: data.marital_status,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        mother_tongue: data.mother_tongue,
        about_me: data.about_me,
      },
      create: {
        user_id: userId,
        profile_for: data.profile_for || "Self",
        gender: data.gender || "Male",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        dob: data.dob || "1995-01-01",
        marital_status: data.marital_status,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        mother_tongue: data.mother_tongue,
        about_me: data.about_me,
      },
    });

    if (data.first_name || data.last_name) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      });
    }
  }

  async updateLocationDetails(userId: number, data: any): Promise<void> {
    await prisma.memberLocation.upsert({
      where: { user_id: userId },
      update: {
        country: data.country,
        state: data.state,
        district: data.district,
        city: data.city,
        pincode: data.pincode,
        native_place: data.native_place,
      },
      create: {
        user_id: userId,
        country: data.country || "India",
        state: data.state || "Kerala",
        district: data.district,
        city: data.city,
        pincode: data.pincode,
        native_place: data.native_place,
      },
    });
  }

  async updateEducationDetails(userId: number, data: any): Promise<void> {
    await prisma.memberEducation.deleteMany({ where: { user_id: userId } });
    await prisma.memberEducation.create({
      data: {
        user_id: userId,
        highest_education: data.highest_education,
        degree: data.degree,
        institution: data.institution,
        education_field: data.education_field,
      },
    });
  }

  async updateOccupationDetails(userId: number, data: any): Promise<void> {
    await prisma.memberOccupation.deleteMany({ where: { user_id: userId } });
    await prisma.memberOccupation.create({
      data: {
        user_id: userId,
        occupation_type: data.occupation_type,
        profession: data.profession,
        company_name: data.company_name,
        annual_income: data.annual_income,
        currency: data.currency || "INR",
      },
    });
  }

  async updateFamilyDetails(userId: number, data: any): Promise<void> {
    await prisma.memberFamily.upsert({
      where: { user_id: userId },
      update: {
        family_status: data.family_status,
        financial_status: data.financial_status,
        family_type: data.family_type,
        father_name: data.father_name,
        father_occupation: data.father_occupation,
        mother_name: data.mother_name,
        mother_occupation: data.mother_occupation,
        siblings_count: data.siblings_count,
      },
      create: {
        user_id: userId,
        family_status: data.family_status,
        financial_status: data.financial_status,
        family_type: data.family_type,
        father_name: data.father_name,
        father_occupation: data.father_occupation,
        mother_name: data.mother_name,
        mother_occupation: data.mother_occupation,
        siblings_count: data.siblings_count || 0,
      },
    });
  }

  async updatePreferences(userId: number, data: any): Promise<void> {
    await prisma.memberPreference.upsert({
      where: { user_id: userId },
      update: {
        age_min: data.age_min,
        age_max: data.age_max,
        height_min: data.height_min,
        height_max: data.height_max,
        marital_status_list: data.marital_status_list,
        district_list: data.district_list,
        education_list: data.education_list,
        profession_list: data.profession_list,
        community_list: data.community_list,
      },
      create: {
        user_id: userId,
        age_min: data.age_min || 18,
        age_max: data.age_max || 60,
        height_min: data.height_min,
        height_max: data.height_max,
        marital_status_list: data.marital_status_list,
        district_list: data.district_list,
        education_list: data.education_list,
        profession_list: data.profession_list,
        community_list: data.community_list,
      },
    });
  }

  async updatePrivacySettings(userId: number, data: any): Promise<void> {
    await prisma.memberPrivacy.upsert({
      where: { user_id: userId },
      update: {
        phone_privacy: data.phone_privacy,
        photo_privacy: data.photo_privacy,
        biodata_download_allowed: data.biodata_download_allowed,
      },
      create: {
        user_id: userId,
        phone_privacy: data.phone_privacy || "MATCHES_ONLY",
        photo_privacy: data.photo_privacy || "PUBLIC",
        biodata_download_allowed: data.biodata_download_allowed ?? true,
      },
    });
  }

  async addProfileMedia(userId: number, mediaData: { url: string; media_type?: string; is_primary?: boolean }): Promise<any> {
    if (mediaData.is_primary) {
      await prisma.memberMedia.updateMany({
        where: { user_id: userId },
        data: { is_primary: false },
      });
    }

    return await prisma.memberMedia.create({
      data: {
        user_id: userId,
        url: mediaData.url,
        media_type: mediaData.media_type || "PHOTO",
        is_primary: mediaData.is_primary ?? false,
      },
    });
  }

  async deleteProfileMedia(userId: number, mediaId: number): Promise<boolean> {
    const media = await prisma.memberMedia.findFirst({
      where: { id: mediaId, user_id: userId },
    });
    if (!media) return false;

    await prisma.memberMedia.delete({ where: { id: mediaId } });
    return true;
  }

  async setPrimaryMedia(userId: number, mediaId: number): Promise<boolean> {
    const media = await prisma.memberMedia.findFirst({
      where: { id: mediaId, user_id: userId },
    });
    if (!media) return false;

    await prisma.memberMedia.updateMany({
      where: { user_id: userId },
      data: { is_primary: false },
    });

    await prisma.memberMedia.update({
      where: { id: mediaId },
      data: { is_primary: true },
    });

    return true;
  }
}
