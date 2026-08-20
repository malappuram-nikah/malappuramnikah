import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { OtpEntity } from "../../domain/entities/otp.entity";
import { prisma } from "../../../../infrastructure/database/prisma.service";

export class PrismaOtpRepository implements IOtpRepository {
  async createOtp(userId: number, otpCode: string, expiresAt: Date): Promise<OtpEntity> {
    await this.invalidatePreviousOtps(userId);

    const created = await prisma.verify.create({
      data: {
        user_id: userId,
        otp_code: otpCode,
        expires_at: expiresAt,
        is_verified: false,
      },
    });

    return created as unknown as OtpEntity;
  }

  async findLatestOtp(userId: number): Promise<OtpEntity | null> {
    const record = await prisma.verify.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return record ? (record as unknown as OtpEntity) : null;
  }

  async markOtpAsVerified(id: number): Promise<void> {
    await prisma.verify.update({
      where: { id },
      data: { is_verified: true },
    });
  }

  async invalidatePreviousOtps(userId: number): Promise<void> {
    await prisma.verify.deleteMany({
      where: { user_id: userId },
    });
  }
}
