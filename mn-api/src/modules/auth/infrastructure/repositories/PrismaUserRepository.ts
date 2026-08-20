import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserEntity } from "../../domain/entities/user.entity";
import { prisma, runInTransaction } from "../../../../infrastructure/database/prisma.service";

export class PrismaUserRepository implements IUserRepository {
  async createUser(userData: Partial<UserEntity>, referralCodeInput?: string): Promise<UserEntity> {
    return await runInTransaction(async (tx) => {
      const created = await tx.user.create({
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

      if (referralCodeInput) {
        const referrer = await tx.user.findUnique({
          where: { referral_code: referralCodeInput },
        });

        if (referrer && referrer.id !== created.id) {
          const settings = await tx.referralSettings.findFirst();
          const rewardPoints = settings?.enabled ? settings.points_per_referral : 100;

          await tx.referral.create({
            data: {
              referrer_id: referrer.id,
              referred_user_id: created.id,
              referral_code: referralCodeInput,
              status: "SUCCESS",
              rewarded: true,
            },
          });

          await tx.referralTransaction.create({
            data: {
              user_id: referrer.id,
              points: rewardPoints,
              type: "EARN",
              reason: `Referred new user: ${created.first_name} ${created.last_name}`,
            },
          });

          await tx.user.update({
            where: { id: referrer.id },
            data: {
              referral_points: { increment: rewardPoints },
            },
          });

          await tx.notification.create({
            data: {
              user_id: referrer.id,
              sender_id: created.id,
              type: "REFERRAL_BONUS",
              title: "Referral Bonus Earned! 🎉",
              message: `You earned ${rewardPoints} points for referring ${created.first_name}!`,
            },
          });
        }
      }

      return created as unknown as UserEntity;
    });
  }

  async findByMobileNumber(mobileNumber: string): Promise<UserEntity | null> {
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

  async findById(id: number): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
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

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateLastLogin(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { last_login: new Date() },
    });
  }
}
