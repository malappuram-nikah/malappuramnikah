import crypto from "crypto";
import { OtpRepository } from "../../infrastructure/repositories/OtpRepository";
import {
  OtpChannel,
  OtpPurpose,
  OtpVerifyResult,
} from "../../domain/entities/otp-core.interface";

export class OtpService {
  private static repository = new OtpRepository();

  /**
   * Cryptographically secure numeric 6-digit OTP generator.
   * Uses Node.js CSPRNG (crypto.randomInt) instead of Math.random.
   */
  public static generateNumericOtp(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length);
    const codeInt = crypto.randomInt(min, max);
    return codeInt.toString();
  }

  /**
   * Computes SHA-256 hash of an OTP code string.
   */
  public static hashOtp(otpCode: string): string {
    return crypto.createHash("sha256").update(otpCode.trim()).digest("hex");
  }

  /**
   * Core method to generate, hash, persist, and return in-memory OTP plaintext for delivery.
   * Enforces 60-second backend resend cooldown.
   */
  public static async requestOtp(params: {
    targetIdentifier: string;
    channel?: OtpChannel;
    purpose?: OtpPurpose;
    expiresInSeconds?: number;
    cooldownSeconds?: number;
  }): Promise<{ success: boolean; message: string; otpCode?: string; userId?: number; user?: any }> {
    const { targetIdentifier, channel = "EMAIL", purpose = "VERIFICATION", expiresInSeconds = 600, cooldownSeconds = 60 } = params;

    const user = await this.repository.findUserByIdentifier(targetIdentifier);
    if (!user) {
      return {
        success: false,
        message: "No account found matching this mobile number or email address.",
      };
    }

    // Enforce 60-second backend resend cooldown
    const cooldownCheck = await this.repository.checkResendCooldown(user.id, channel, purpose, cooldownSeconds);
    if (cooldownCheck.inCooldown) {
      return {
        success: false,
        message: `Please wait ${cooldownCheck.remainingSeconds} seconds before requesting another verification code.`,
      };
    }

    const otpCode = this.generateNumericOtp(6);
    const hashedOtp = this.hashOtp(otpCode);

    await this.repository.saveOtpRecord({
      userId: user.id,
      hashedOtp,
      channel,
      purpose,
      expiresInSeconds,
    });

    console.log(`[OTP SERVICE] Generated & Hashed OTP for user #${user.id} (${channel}/${purpose})`);

    return {
      success: true,
      message: "Verification code generated successfully.",
      otpCode, // Plaintext returned ONLY in memory for delivery provider
      userId: user.id,
      user,
    };
  }

  /**
   * Core verification method.
   * Handles dual-verification (SHA-256 hash vs legacy plaintext), attempt limits (max 5),
   * expiration checks, and single-use consumption.
   */
  public static async verifyOtp(params: {
    targetIdentifier: string;
    otpCode: string | string[];
    channel?: OtpChannel;
    purpose?: OtpPurpose;
    maxAttempts?: number;
  }): Promise<OtpVerifyResult> {
    const { targetIdentifier, otpCode, channel = "EMAIL", purpose = "VERIFICATION", maxAttempts = 5 } = params;
    const codeString = (Array.isArray(otpCode) ? otpCode.join("") : String(otpCode)).trim();

    if (!codeString) {
      return { valid: false, message: "Verification code is required." };
    }

    const user = await this.repository.findUserByIdentifier(targetIdentifier);
    if (!user) {
      return { valid: false, message: "User account not found." };
    }

    const activeRecord = await this.repository.findActiveOtpRecord(user.id, channel, purpose);
    if (!activeRecord) {
      return { valid: false, message: "Invalid or expired verification code.", expired: true };
    }

    // Check expiration
    if (new Date() > new Date(activeRecord.expires_at)) {
      await this.repository.deleteOtpRecord(activeRecord.id);
      return { valid: false, message: "Invalid or expired verification code.", expired: true };
    }

    // Perform Dual-Verification (SHA-256 hash OR legacy plaintext match)
    const inputHash = this.hashOtp(codeString);
    const isHashMatch = activeRecord.otp_code === inputHash;
    const isPlaintextMatch = activeRecord.otp_code === codeString;

    if (isHashMatch || isPlaintextMatch) {
      // Single-use consumption: Delete OTP record immediately
      await this.repository.deleteOtpRecord(activeRecord.id);
      console.log(`[OTP SERVICE SUCCESS] OTP verified & consumed for user #${user.id} (${channel}/${purpose})`);
      return { valid: true, message: "OTP verified successfully." };
    }

    // Increment failed attempt counter
    const updatedAttempts = await this.repository.incrementAttempts(activeRecord.id);
    console.warn(`[OTP SERVICE WARN] Failed verification attempt ${updatedAttempts}/${maxAttempts} for user #${user.id}`);

    if (updatedAttempts >= maxAttempts) {
      // Exceeded max attempts: invalidate OTP
      await this.repository.deleteOtpRecord(activeRecord.id);
      console.warn(`[OTP SERVICE INVALIDATED] Exceeded ${maxAttempts} attempts. OTP record #${activeRecord.id} invalidated.`);
      return {
        valid: false,
        message: "Invalid or expired verification code.",
        attemptsExceeded: true,
      };
    }

    return { valid: false, message: "Invalid or expired verification code." };
  }
}
