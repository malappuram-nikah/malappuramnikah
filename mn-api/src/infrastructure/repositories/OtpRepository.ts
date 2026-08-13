import { IOtpRepository } from "../../domain/interfaces/IOtpRepository";
import prisma from "../prisma/prisamClient";

export class OtpRepository implements IOtpRepository {
  async saveOtp(
    otp: string,
    phoneNumber: string,
    expiresIn: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Remove stale OTP records so resend always verifies against the latest code
    await prisma.verify.deleteMany({
      where: {
        user: { mobile_number: phoneNumber },
        is_verified: false,
      },
    });

    await prisma.verify.create({
      data: {
        otp_code: otp,
        user: {
          connect: { mobile_number: phoneNumber },
        },
        expires_at: expiresAt,
        is_verified: false,
      },
    });
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    const verifyRecord = await prisma.verify.findFirst({
      where: {
        user: { mobile_number: phoneNumber },
        is_verified: false,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    return verifyRecord ? verifyRecord.otp_code : null;
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    await prisma.verify.deleteMany({
      where: {
        user: { mobile_number: phoneNumber },
        is_verified: false,
      },
    });
  }
}
