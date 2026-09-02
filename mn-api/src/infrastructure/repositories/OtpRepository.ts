import { IOtpRepository } from "../../domain/interfaces/IOtpRepository";
import { OtpChannel, OtpPurpose, OtpRecord, OtpSaveParams } from "../../domain/entities/otp-core.interface";
import prisma from "../prisma/prisamClient";

export class OtpRepository implements IOtpRepository {
  private static schemaMigrated = false;

  /**
   * Automatically ensure missing columns exist on the "verify" table
   * across any connected database instance (Dev, Staging, or Prod).
   */
  public static async ensureColumnsExist(): Promise<void> {
    if (this.schemaMigrated) return;
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "verify" 
        ADD COLUMN IF NOT EXISTS "channel" VARCHAR(50) DEFAULT 'EMAIL',
        ADD COLUMN IF NOT EXISTS "purpose" VARCHAR(50) DEFAULT 'VERIFICATION',
        ADD COLUMN IF NOT EXISTS "attempts" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3) DEFAULT (NOW() + INTERVAL '10 minutes'),
        ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT NOW();
      `);
      this.schemaMigrated = true;
      console.log("[OTP REPO] Schema auto-migration: 'verify' table columns ensured.");
    } catch (err: any) {
      console.warn("[OTP REPO WARN] Schema auto-migration check:", err?.message || err);
    }
  }

  public async findUserByIdentifier(identifier: string) {
    if (!identifier) return null;
    const clean = identifier.trim();
    const isEmail = clean.includes("@");

    if (isEmail) {
      return prisma.user.findFirst({
        where: { email: { equals: clean.toLowerCase(), mode: "insensitive" } },
        select: { id: true, mobile_number: true, email: true, first_name: true, last_name: true, status: true, profile_details: true },
      });
    }

    const digits = clean.replace(/\D/g, "");
    const rawDigits = digits.replace(/^0+/, "");
    const last8 = rawDigits.length >= 8 ? rawDigits.slice(-8) : rawDigits;
    const last10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    return prisma.user.findFirst({
      where: {
        OR: [
          { mobile_number: clean },
          { mobile_number: `+${digits}` },
          { mobile_number: digits },
          { mobile_number: rawDigits },
          { mobile_number: last8 },
          { mobile_number: last10 },
          { mobile_number: `+91${last10}` },
          { mobile_number: { endsWith: last8 } },
          { email: { equals: clean.toLowerCase(), mode: "insensitive" } },
        ],
      },
      select: { id: true, mobile_number: true, email: true, first_name: true, last_name: true, status: true, profile_details: true },
    });
  }

  // --- Legacy Interface Implementation ---

  async saveOtp(
    otp: string,
    phoneNumber: string,
    expiresIn: number = 600,
    channel: string = "EMAIL",
    purpose: string = "VERIFICATION"
  ): Promise<void> {
    const user = await this.findUserByIdentifier(phoneNumber);
    if (!user) {
      console.warn(`[OTP REPOSITORY] No user found for identifier ${phoneNumber}. Unable to link OTP.`);
      return;
    }

    await this.saveOtpRecord({
      userId: user.id,
      hashedOtp: otp,
      channel: channel as OtpChannel,
      purpose: purpose as OtpPurpose,
      expiresInSeconds: expiresIn,
    });
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    const user = await this.findUserByIdentifier(phoneNumber);
    if (!user) return null;

    const record = await this.findActiveOtpRecord(user.id);
    return record ? record.otp_code : null;
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    const user = await this.findUserByIdentifier(phoneNumber);
    if (!user) return;

    await this.deleteUserOtps(user.id);
  }

  // --- Enhanced Multi-Channel & Multi-Purpose Repository Methods ---

  async saveOtpRecord(params: OtpSaveParams): Promise<OtpRecord> {
    await OtpRepository.ensureColumnsExist();

    const expiresIn = params.expiresInSeconds ?? 600; // Default 10 mins (600s)
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const channel = params.channel || "EMAIL";
    const purpose = params.purpose || "VERIFICATION";

    try {
      // Invalidate existing unverified OTP records for this user, channel, and purpose
      await prisma.verify.deleteMany({
        where: {
          user_id: params.userId,
          channel,
          purpose,
          is_verified: false,
        },
      });

      const record = await prisma.verify.create({
        data: {
          user_id: params.userId,
          otp_code: params.hashedOtp,
          channel,
          purpose,
          attempts: 0,
          expires_at: expiresAt,
          is_verified: false,
        },
      });

      console.log(`[OTP SAVED] Created OTP record #${record.id} for user #${params.userId} (${channel}/${purpose})`);
      return record as OtpRecord;
    } catch (err: any) {
      // If error indicates missing column, force migration and retry once
      if (err?.message?.includes("does not exist")) {
        console.warn("[OTP REPO] Column missing in database. Forcing schema migration and retrying save...");
        OtpRepository.schemaMigrated = false;
        await OtpRepository.ensureColumnsExist();

        const record = await prisma.verify.create({
          data: {
            user_id: params.userId,
            otp_code: params.hashedOtp,
            channel,
            purpose,
            attempts: 0,
            expires_at: expiresAt,
            is_verified: false,
          },
        });
        return record as OtpRecord;
      }
      throw err;
    }
  }

  async findActiveOtpRecord(
    userId: number,
    channel?: OtpChannel,
    purpose?: OtpPurpose
  ): Promise<OtpRecord | null> {
    await OtpRepository.ensureColumnsExist();

    const whereClause: any = {
      user_id: userId,
      is_verified: false,
      expires_at: { gte: new Date() },
    };

    if (channel) whereClause.channel = channel;
    if (purpose) whereClause.purpose = purpose;

    try {
      const record = await prisma.verify.findFirst({
        where: whereClause,
        orderBy: { created_at: "desc" },
      });

      return record as OtpRecord | null;
    } catch (err: any) {
      if (err?.message?.includes("does not exist")) {
        console.warn("[OTP REPO] Column missing in database. Forcing schema migration and retrying lookup...");
        OtpRepository.schemaMigrated = false;
        await OtpRepository.ensureColumnsExist();

        const record = await prisma.verify.findFirst({
          where: whereClause,
          orderBy: { created_at: "desc" },
        });
        return record as OtpRecord | null;
      }
      throw err;
    }
  }

  async incrementAttempts(recordId: number): Promise<number> {
    try {
      const updated = await prisma.verify.update({
        where: { id: recordId },
        data: {
          attempts: { increment: 1 },
        },
        select: { attempts: true },
      });

      return updated.attempts;
    } catch {
      return 1;
    }
  }

  async deleteOtpRecord(recordId: number): Promise<void> {
    try {
      await prisma.verify.delete({
        where: { id: recordId },
      });
    } catch {
      // Record already deleted
    }
  }

  async deleteUserOtps(
    userId: number,
    channel?: OtpChannel,
    purpose?: OtpPurpose
  ): Promise<void> {
    try {
      const whereClause: any = {
        user_id: userId,
        is_verified: false,
      };
      if (channel) whereClause.channel = channel;
      if (purpose) whereClause.purpose = purpose;

      await prisma.verify.deleteMany({
        where: whereClause,
      });
    } catch {
      // Ignore if table/records empty
    }
  }

  async checkResendCooldown(
    userId: number,
    channel: OtpChannel = "EMAIL",
    purpose: OtpPurpose = "VERIFICATION",
    cooldownSeconds: number = 60
  ): Promise<{ inCooldown: boolean; remainingSeconds: number }> {
    await OtpRepository.ensureColumnsExist();

    try {
      const recentRecord = await prisma.verify.findFirst({
        where: {
          user_id: userId,
          channel,
          purpose,
        },
        orderBy: { created_at: "desc" },
      });

      if (!recentRecord) {
        return { inCooldown: false, remainingSeconds: 0 };
      }

      const elapsedSeconds = Math.floor((Date.now() - recentRecord.created_at.getTime()) / 1000);
      if (elapsedSeconds < cooldownSeconds) {
        const remainingSeconds = cooldownSeconds - elapsedSeconds;
        return { inCooldown: true, remainingSeconds };
      }

      return { inCooldown: false, remainingSeconds: 0 };
    } catch (err: any) {
      if (err?.message?.includes("does not exist")) {
        console.warn("[OTP REPO] Column missing in checkResendCooldown. Forcing migration...");
        OtpRepository.schemaMigrated = false;
        await OtpRepository.ensureColumnsExist();
        return { inCooldown: false, remainingSeconds: 0 };
      }
      return { inCooldown: false, remainingSeconds: 0 };
    }
  }
}
