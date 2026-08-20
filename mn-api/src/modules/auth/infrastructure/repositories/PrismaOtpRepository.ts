import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { prisma } from "../../../../infrastructure/database/prisma.service";

export class PrismaOtpRepository implements IOtpRepository {
  async createOtp(target: string, otpCode: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const isEmail = target.includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: { equals: target.toLowerCase(), mode: "insensitive" } }
        : {
            OR: [
              { mobile_number: target },
              { mobile_number: `+91${target.replace(/\D/g, "").slice(-10)}` },
            ],
          },
    });

    if (!user) return;

    await prisma.verify.deleteMany({
      where: { user_id: user.id },
    });

    await prisma.verify.create({
      data: {
        user_id: user.id,
        otp_code: otpCode,
        expires_at: expiresAt,
        is_verified: false,
      },
    });
  }

  async verifyOtp(target: string, otpCode: string): Promise<boolean> {
    const isEmail = target.includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: { equals: target.toLowerCase(), mode: "insensitive" } }
        : {
            OR: [
              { mobile_number: target },
              { mobile_number: `+91${target.replace(/\D/g, "").slice(-10)}` },
            ],
          },
    });

    if (!user) return false;

    const record = await prisma.verify.findFirst({
      where: {
        user_id: user.id,
        otp_code: otpCode.trim(),
        is_verified: false,
        expires_at: { gte: new Date() },
      },
    });

    if (!record) return false;

    await prisma.verify.update({
      where: { id: record.id },
      data: { is_verified: true },
    });

    return true;
  }
}
