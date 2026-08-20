import { rateLimiterService } from "../../infrastructure/security/rateLimiter.service";
import { verifyToken } from "../../../../shared/auth/jwt.util";

describe("Auth Module - Security Tests", () => {
  beforeEach(() => {
    rateLimiterService.resetLoginRateLimit("login:test_brute_force");
    rateLimiterService.resetOtpAttemptLimit("otp_attempts:+919999999999");
  });

  describe("Anti-Brute-Force & Lockout Protection", () => {
    it("should lock out after 5 consecutive failed login attempts", () => {
      const key = "login:test_brute_force";

      for (let i = 0; i < 5; i++) {
        rateLimiterService.recordFailedLogin(key);
      }

      expect(() => rateLimiterService.checkLoginRateLimit(key)).toThrow(
        /Too many failed login attempts/
      );
    });

    it("should lock out OTP verification after 3 failed OTP attempts", () => {
      const key = "otp_attempts:+919999999999";

      for (let i = 0; i < 3; i++) {
        rateLimiterService.recordFailedOtpAttempt(key);
      }

      expect(() => rateLimiterService.checkOtpAttemptLimit(key)).toThrow(
        /OTP attempt limit exceeded/
      );
    });

    it("should enforce OTP dispatch cooldown", () => {
      const key = "otp_cooldown:+919999999999";
      rateLimiterService.recordOtpDispatch(key);

      expect(() => rateLimiterService.checkOtpDispatchCooldown(key)).toThrow(
        /OTP already sent recently/
      );
    });
  });

  describe("Token & Signature Validation", () => {
    it("should reject malformed JWT tokens", () => {
      expect(() => verifyToken("invalid.jwt.token")).toThrow();
    });

    it("should reject tampered or forged JWT tokens", () => {
      const forgedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.forgedsignature";
      expect(() => verifyToken(forgedToken)).toThrow();
    });
  });
});
