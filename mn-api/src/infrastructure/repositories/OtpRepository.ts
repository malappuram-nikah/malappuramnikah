import { IOtpRepository } from "../../domain/interfaces/IOtpRepository";
import prisma from "../prisma/prisamClient";

export class OtpRepository implements IOtpRepository {
  private async findUser(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { mobile_number: identifier },
          { email: { equals: identifier, mode: "insensitive" } }
        ]
      }
    });
  }

  async saveOtp(
    otp: string,
    phoneNumber: string,
    expiresIn: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const user = await this.findUser(phoneNumber);
    
    if (!user) {
      console.warn(`Cannot save OTP: User not found for identifier ${phoneNumber}`);
      return;
    }

    // Remove stale OTP records so resend always verifies against the latest code
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
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    const user = await this.findUser(phoneNumber);
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
    const user = await this.findUser(phoneNumber);
    if (!user) return;

    await prisma.verify.deleteMany({
      where: {
        user_id: user.id,
        is_verified: false,
      },
    });
  }
}
