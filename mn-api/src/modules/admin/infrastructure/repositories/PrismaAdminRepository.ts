import path from "path";
import fs from "fs";
import { IAdminRepository } from "../../domain/repositories/IAdminRepository";
import { AdminEntity } from "../../domain/entities/admin.entity";
import { prisma } from "../../../../infrastructure/database/prisma.service";
import {
  ADMIN_USER_SELECT,
  averageProfileCompletion,
  buildKycDocumentUrl,
  calculateProfileCompletion,
} from "../../../../infrastructure/helpers/admin.helpers";

const STORE_PATH = path.join(process.cwd(), "src", "infrastructure", "data", "adminStore.json");

export class PrismaAdminRepository implements IAdminRepository {
  async findAdminByEmail(email: string): Promise<AdminEntity | null> {
    const admin = await prisma.admin.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    return admin as unknown as AdminEntity;
  }

  async findAdminByMobile(mobileNumber: string): Promise<AdminEntity | null> {
    const cleanMobile = mobileNumber.replace(/\D/g, "");
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { mobile_number: { contains: cleanMobile } },
          { mobile_number: "+911212121212" },
        ],
      },
    });
    return admin as unknown as AdminEntity;
  }

  async findAdminById(id: number): Promise<AdminEntity | null> {
    const admin = await prisma.admin.findFirst({
      where: { id, is_active: true },
    });
    return admin as unknown as AdminEntity;
  }

  async seedAdmin(data: { name: string; email: string; mobile_number: string; passwordHash: string; role: string }): Promise<AdminEntity> {
    const seeded = await prisma.admin.upsert({
      where: { email: data.email },
      update: {
        password: data.passwordHash,
        role: data.role,
        is_active: true,
      },
      create: {
        name: data.name,
        email: data.email,
        mobile_number: data.mobile_number,
        password: data.passwordHash,
        role: data.role,
        is_active: true,
      },
    });
    return seeded as unknown as AdminEntity;
  }

  async getAdminStats(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      suspendedUsers,
      inactiveUsers,
      premiumUsers,
      kycPending,
      kycUnderReview,
      kycVerified,
      kycRejected,
      referralTotal,
      referralSuccess,
      referralPending,
      completionSample,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { status: "suspended" } }),
      prisma.user.count({ where: { status: "in_active" } }),
      prisma.user.count({ where: { is_premium: true } }),
      prisma.user.count({ where: { kyc_status: "PENDING" } }),
      prisma.user.count({ where: { kyc_status: "UNDER_REVIEW" } }),
      prisma.user.count({ where: { kyc_status: "VERIFIED" } }),
      prisma.user.count({ where: { kyc_status: "REJECTED" } }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: "SUCCESS" } }),
      prisma.referral.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        select: { first_name: true, last_name: true, cast: true, location: true, gender: true, kyc_status: true, profile_details: true },
        take: 500,
        orderBy: { id: "desc" },
      }),
    ]);

    const averageCompletion = averageProfileCompletion(completionSample as any);

    const dailyStart = new Date();
    dailyStart.setDate(dailyStart.getDate() - 29);
    dailyStart.setHours(0, 0, 0, 0);

    const monthlyStart = new Date();
    monthlyStart.setMonth(monthlyStart.getMonth() - 11);
    monthlyStart.setDate(1);
    monthlyStart.setHours(0, 0, 0, 0);

    const [recentUsers, genderGroups, statusGroups, kycGroups] = await Promise.all([
      prisma.user.findMany({
        where: { created_at: { gte: monthlyStart } },
        select: { created_at: true },
        orderBy: { created_at: "asc" },
      }),
      prisma.user.groupBy({ by: ["gender"], _count: { id: true } }),
      prisma.user.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.user.groupBy({ by: ["kyc_status"], _count: { id: true } }),
    ]);

    const dailyRegistrations: { date: string; label: string; count: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(dailyStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyRegistrations.push({
        date: key,
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        count: 0,
      });
    }

    const monthlyRegistrations: { month: string; label: string; count: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(monthlyStart);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRegistrations.push({
        month: key,
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        count: 0,
      });
    }

    for (const u of recentUsers) {
      const dayKey = new Date(u.created_at).toISOString().slice(0, 10);
      const dayEntry = dailyRegistrations.find((d) => d.date === dayKey);
      if (dayEntry) dayEntry.count += 1;

      const monthKey = `${new Date(u.created_at).getFullYear()}-${String(new Date(u.created_at).getMonth() + 1).padStart(2, "0")}`;
      const monthEntry = monthlyRegistrations.find((m) => m.month === monthKey);
      if (monthEntry) monthEntry.count += 1;
    }

    const mapGroups = (groups: { _count: { id: number }; [key: string]: unknown }[], field: string) =>
      groups.map((g) => ({
        label: String(g[field] || "Unknown").replace("_", " "),
        value: g._count.id,
      }));

    return {
      totalUsers,
      activeUsers,
      newUsers,
      suspendedUsers,
      inactiveUsers,
      premiumUsers,
      averageCompletion,
      kycPending,
      kycUnderReview,
      kycVerified,
      kycRejected,
      referralTotal,
      referralSuccess,
      referralPending,
      analytics: {
        dailyRegistrations,
        monthlyRegistrations,
        usersByGender: mapGroups(genderGroups as any, "gender"),
        usersByStatus: mapGroups(statusGroups as any, "status"),
        usersByKyc: mapGroups(kycGroups as any, "kyc_status"),
      },
    };
  }

  async getAdminUsers(params: any): Promise<{ users: any[]; total: number }> {
    const page = Math.max(parseInt(params.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(params.limit || "10", 10), 1), 100);
    const search = (params.search || "").trim();
    const status = (params.status || "").trim();
    const kycStatus = (params.kyc_status || "").trim();
    const gender = (params.gender || "").trim();
    const dateFrom = (params.date_from || "").trim();
    const dateTo = (params.date_to || "").trim();
    const skip = (page - 1) * limit;
    const isPremium = params.is_premium === "true";

    const where: any = {};
    if (status) {
      if (status === "new") {
        where.created_at = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      } else {
        where.status = status;
      }
    }
    if (isPremium) where.is_premium = true;
    if (kycStatus) where.kyc_status = kycStatus;
    if (gender) where.gender = { equals: gender, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) where.created_at.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    if (search) {
      const profileIdMatch = search.match(/^MN-?(\d+)$/i);
      if (profileIdMatch) {
        const numericId = parseInt(profileIdMatch[1], 10);
        const resolvedId = numericId > 100000 ? numericId - 100000 : numericId;
        where.id = resolvedId;
      } else {
        where.OR = [
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { mobile_number: { contains: search } },
          { location: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { created_at: "desc" },
        select: ADMIN_USER_SELECT as any,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const enriched = users.map((u: any) => ({
      ...u,
      profileId: `MN-${100000 + u.id}`,
      profileCompletion: calculateProfileCompletion(u),
    }));

    return { users: enriched, total };
  }

  async getAdminUserById(id: number, token?: string): Promise<any> {
    const user: any = await prisma.user.findUnique({
      where: { id },
      select: ADMIN_USER_SELECT as any,
    });
    if (!user) return null;

    return {
      ...user,
      profileId: `MN-${100000 + user.id}`,
      profileCompletion: calculateProfileCompletion(user),
      kyc_front_url: buildKycDocumentUrl(user.kyc_front_url, token),
      kyc_back_url: buildKycDocumentUrl(user.kyc_back_url, token),
    };
  }

  async updateUserStatus(id: number, status: string): Promise<any> {
    const updated: any = await prisma.user.update({
      where: { id },
      data: { status },
      select: ADMIN_USER_SELECT as any,
    });
    return {
      ...updated,
      profileId: `MN-${100000 + updated.id}`,
      profileCompletion: calculateProfileCompletion(updated),
    };
  }

  async updateUserKycVerification(id: number, status: string): Promise<any> {
    return await prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async toggleUserPremium(id: number): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");

    const updated = await prisma.user.update({
      where: { id },
      data: { is_premium: !user.is_premium },
    });
    return updated.is_premium;
  }

  getAdminStoreData(): any {
    try {
      const parentDir = path.dirname(STORE_PATH);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (!fs.existsSync(STORE_PATH)) {
        const defaultStore = {
          vendors: [],
          bookings: [],
          templates_save_the_date: [],
          templates_wedding_invitation: [],
          reports: [],
          subscriptions: [],
          cms: {},
          activity_logs: [],
          biodata_settings: { enable_download: true },
        };
        fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore, null, 2));
        return defaultStore;
      }

      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      return { vendors: [], bookings: [], templates_save_the_date: [], templates_wedding_invitation: [], reports: [], subscriptions: [], cms: {}, activity_logs: [], biodata_settings: { enable_download: true } };
    }
  }

  saveAdminStoreData(store: any): void {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
    } catch (err) {
      console.error("Failed to save adminStore.json:", err);
    }
  }
}
