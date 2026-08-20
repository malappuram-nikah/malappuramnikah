import dns from "dns";
import { ValidationError } from "../../../shared/errors/AppError";

export function validateMobileNumber(mobileNumber: string): string {
  if (!mobileNumber || typeof mobileNumber !== "string") {
    throw new ValidationError("Mobile number is required");
  }
  const clean = mobileNumber.trim();
  if (!/^\+?[1-9]\d{9,14}$/.test(clean.replace(/\s+/g, ""))) {
    throw new ValidationError("Invalid mobile number format. Must include country code (e.g. +919876543210)");
  }
  return clean;
}

export function validateEmailFormat(email: string | undefined | null): string | null {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    throw new ValidationError("Invalid email address format.");
  }
  return clean;
}

export async function verifyGmailAvailability(email: string): Promise<string> {
  const cleanEmail = validateEmailFormat(email);
  if (!cleanEmail) {
    throw new ValidationError("Email address is required.");
  }

  const domain = cleanEmail.split("@")[1];
  if (domain !== "gmail.com" && domain !== "googlemail.com") {
    throw new ValidationError("Registration requires a valid @gmail.com email address.");
  }

  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new ValidationError("Gmail domain MX records could not be resolved.");
    }
    const isGoogleMx = mxRecords.some((record) =>
      record.exchange.toLowerCase().includes("google") || record.exchange.toLowerCase().includes("smtp")
    );
    if (!isGoogleMx) {
      throw new ValidationError("Invalid Gmail mail server.");
    }
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    // Fallback if DNS query fails in sandbox
  }

  return cleanEmail;
}

export function validatePassword(password: string): string {
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long.");
  }
  return password;
}

export function validateOtpCode(otpCode: string): string {
  if (!otpCode || typeof otpCode !== "string" || !/^\d{4,6}$/.test(otpCode.trim())) {
    throw new ValidationError("OTP code must be a 4 to 6 digit numeric code.");
  }
  return otpCode.trim();
}
