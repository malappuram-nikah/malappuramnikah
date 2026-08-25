import { IOtpRepository } from "../../domain/interfaces/IOtpRepository";
import prisma from "../prisma/prisamClient";

export class OtpRepository implements IOtpRepository {
  private async findUserByIdentifier(identifier: string) {
    if (!identifier) return null;
    const clean = identifier.trim();
    const isEmail = clean.includes("@");

    if (isEmail) {
      return prisma.user.findFirst({
        where: { email: { equals: clean.toLowerCase(), mode: "insensitive" } },
        select: { id: true, mobile_number: true, email: true },
      });
    }

    const digits = clean.replace(/\D/g, "");
    const rawDigits10 = digits.length >= 10 ? digits.slice(-10) : digits;

    return prisma.user.findFirst({
      where: {
        OR: [
          { mobile_number: clean },
          { mobile_number: `+91${rawDigits10}` },
          { mobile_number: rawDigits10 },
          { mobile_number: `0${rawDigits10}` },
          { email: { equals: clean.toLowerCase(), mode: "insensitive" } },
        ],
      },
      select: { id: true, mobile_number: true, email: true },
    });
  }

  async saveOtp(
    otp: string,
    phoneNumber: string,
    expiresIn: number
  ): Promise<void> {
    const user = await this.findUserByIdentifier(phoneNumber);
    if (!user) {
      console.warn(`[OTP REPOSITORY] No user found for identifier ${phoneNumber}. Unable to link OTP.`);
      return;
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Remove stale unverified OTP records for this user
    await prisma.verify.deleteMany({
      where: {
        user_id: user.id,
        is_verified: false,
      },
    });

    await prisma.verify.create({
      data: {
        otp_code: otp,
        user_id: user.id,
        expires_at: expiresAt,
        is_verified: false,
      },
    });
    console.log(`[OTP SAVED] Linked OTP for user #${user.id} (${user.mobile_number})`);
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    const user = await this.findUserByIdentifier(phoneNumber);
    if (!user) return null;

    const verifyRecord = await prisma.verify.findFirst({
      where: {
        user_id: user.id,
        is_verified: false,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    return verifyRecord ? verifyRecord.otp_code : null;
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    const user = await this.findUserByIdentifier(phoneNumber);
    if (!user) return;

    await prisma.verify.deleteMany({
      where: {
        user_id: user.id,
        is_verified: false,
      },
    });
  }
}
