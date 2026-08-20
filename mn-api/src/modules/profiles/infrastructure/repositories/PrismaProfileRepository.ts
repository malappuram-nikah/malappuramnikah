import { IProfileRepository, GetProfilesOptions, PublicStats } from "../../domain/repositories/IProfileRepository";
import { ProfileEntity } from "../../domain/entities/profile.entity";
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
        where: {
          OR: [{ sender_id: id }, { receiver_id: id }],
        },
      });
      await tx.message.deleteMany({
        where: {
          OR: [{ sender_id: id }, { receiver_id: id }],
        },
      });
      await tx.notification.deleteMany({
        where: {
          OR: [{ user_id: id }, { sender_id: id }],
        },
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
}
