interface RateLimitRecord {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiterService {
  private loginAttempts: Map<string, RateLimitRecord> = new Map();
  private otpAttempts: Map<string, RateLimitRecord> = new Map();
  private otpCooldowns: Map<string, number> = new Map();

  checkLoginRateLimit(key: string): void {
    const record = this.loginAttempts.get(key);
    const now = Date.now();

    if (record && record.blockedUntil && record.blockedUntil > now) {
      const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      throw new Error(`Too many failed login attempts. Please try again in ${waitSeconds} seconds.`);
    }
  }

  recordFailedLogin(key: string): void {
    const now = Date.now();
    const record = this.loginAttempts.get(key) || { attempts: 0, lastAttempt: now };
    record.attempts += 1;
    record.lastAttempt = now;

    if (record.attempts >= 5) {
      record.blockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
    }

    this.loginAttempts.set(key, record);
  }

  resetLoginRateLimit(key: string): void {
    this.loginAttempts.delete(key);
  }

  checkOtpDispatchCooldown(key: string): void {
    const now = Date.now();
    const lastSent = this.otpCooldowns.get(key);
    if (lastSent && now - lastSent < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      throw new Error(`OTP already sent recently. Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }
  }

  recordOtpDispatch(key: string): void {
    this.otpCooldowns.set(key, Date.now());
  }

  checkOtpAttemptLimit(key: string): void {
    const now = Date.now();
    const record = this.otpAttempts.get(key);

    if (record && record.blockedUntil && record.blockedUntil > now) {
      const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      throw new Error(`OTP attempt limit exceeded. Please request a new OTP in ${waitSeconds} seconds.`);
    }
  }

  recordFailedOtpAttempt(key: string): void {
    const now = Date.now();
    const record = this.otpAttempts.get(key) || { attempts: 0, lastAttempt: now };
    record.attempts += 1;
    record.lastAttempt = now;

    if (record.attempts >= 3) {
      record.blockedUntil = now + 10 * 60 * 1000; // 10 minutes lockout after 3 failed OTP attempts
    }

    this.otpAttempts.set(key, record);
  }

  resetOtpAttemptLimit(key: string): void {
    this.otpAttempts.delete(key);
  }
}

export const rateLimiterService = new RateLimiterService();
