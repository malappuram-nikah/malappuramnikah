import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserEntity } from "../../domain/entities/user.entity";
import { prisma } from "../../../../infrastructure/database/prisma.service";

export class PrismaUserRepository implements IUserRepository {
  async createUser(userData: Partial<UserEntity>): Promise<UserEntity> {
    const created = await prisma.user.create({
      data: {
        profile_for: userData.profile_for!,
        gender: userData.gender!,
        first_name: userData.first_name!,
        last_name: userData.last_name!,
        cast: userData.cast!,
        location: userData.location!,
        email: userData.email,
        mobile_number: userData.mobile_number!,
        password: userData.password!,
        dob: userData.dob!,
        status: userData.status || "in_active",
        is_premium: userData.is_premium || false,
        is_new_user: userData.is_new_user !== undefined ? userData.is_new_user : true,
        profile_details: userData.profile_details ? (userData.profile_details as object) : undefined,
        referral_code: userData.referral_code,
        referral_points: userData.referral_points || 0,
      },
    });
    return created as unknown as UserEntity;
  }

  async findByMobile(mobileNumber: string): Promise<UserEntity | null> {
    const digitsOnly = mobileNumber.replace(/\D/g, "");
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile_number: mobileNumber },
          { mobile_number: `+91${digitsOnly.slice(-10)}` },
          { mobile_number: `+${digitsOnly}` },
          { mobile_number: { endsWith: digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly } },
        ],
      },
    });
    return user ? (user as unknown as UserEntity) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: "insensitive" } },
          {
            profile_details: {
              path: ["mn_basic_details_draft", "email"],
              equals: cleanEmail,
            },
          },
        ],
      },
    });
    return user ? (user as unknown as UserEntity) : null;
  }

  async findById(id: number | string): Promise<UserEntity | null> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    if (isNaN(numericId)) return null;

    const user = await prisma.user.findUnique({
      where: { id: numericId },
    });
    return user ? (user as unknown as UserEntity) : null;
  }

  async updateUser(id: number, data: Partial<UserEntity>): Promise<UserEntity> {
    const updated = await prisma.user.update({
      where: { id },
      data: data as any,
    });
    return updated as unknown as UserEntity;
  }

  async updateStatus(id: number, status: string): Promise<UserEntity> {
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    });
    return updated as unknown as UserEntity;
  }
}
