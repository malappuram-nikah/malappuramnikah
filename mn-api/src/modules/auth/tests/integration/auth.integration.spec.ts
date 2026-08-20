import { RegisterUserUseCase } from "../../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../../application/use-cases/LoginUser.usecase";
import { VerifyOtpUseCase } from "../../application/use-cases/VerifyOtp.usecase";
import { ForgotPasswordUseCase } from "../../application/use-cases/ForgotPassword.usecase";
import { ResetPasswordUseCase } from "../../application/use-cases/ResetPassword.usecase";
import { RefreshTokenUseCase } from "../../application/use-cases/RefreshToken.usecase";
import { LogoutUserUseCase } from "../../application/use-cases/LogoutUser.usecase";

import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { UserEntity } from "../../domain/entities/user.entity";
import { OtpEntity } from "../../domain/entities/otp.entity";
import { SessionEntity } from "../../domain/entities/session.entity";
import bcrypt from "bcryptjs";

class InMemoryUserRepository implements IUserRepository {
  private users: Map<number, UserEntity> = new Map();
  private nextId = 1;

  async createUser(userData: Partial<UserEntity>): Promise<UserEntity> {
    const user: UserEntity = {
      id: this.nextId++,
      profile_for: userData.profile_for || "Self",
      gender: userData.gender || "Female",
      first_name: userData.first_name || "Test",
      last_name: userData.last_name || "User",
      cast: userData.cast || "General",
      location: userData.location || "Malappuram",
      email: userData.email,
      mobile_number: userData.mobile_number!,
      password: userData.password,
      dob: userData.dob || "1998-01-01",
      status: userData.status || "in_active",
      kyc_status: userData.kyc_status || "NOT_SUBMITTED",
      is_premium: false,
      is_new_user: true,
      referral_points: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async findByMobileNumber(mobileNumber: string): Promise<UserEntity | null> {
    for (const u of this.users.values()) {
      if (u.mobile_number === mobileNumber) return u;
    }
    return null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const u of this.users.values()) {
      if (u.email === email) return u;
    }
    return null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: number, data: Partial<UserEntity>): Promise<UserEntity> {
    const u = this.users.get(id);
    if (!u) throw new Error("User not found");
    Object.assign(u, data);
    return u;
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    const u = this.users.get(id);
    if (u) u.password = passwordHash;
  }

  async updateEmail(id: number, email: string): Promise<void> {
    const u = this.users.get(id);
    if (u) u.email = email;
  }

  async updateStatus(id: number, status: string): Promise<void> {
    const u = this.users.get(id);
    if (u) u.status = status;
  }

  async updateLastLogin(id: number): Promise<void> {
    const u = this.users.get(id);
    if (u) u.last_login = new Date();
  }
}

class InMemoryOtpRepository implements IOtpRepository {
  private otps: OtpEntity[] = [];
  private nextId = 1;

  async createOtp(userId: number, otpCode: string, expiresAt: Date): Promise<OtpEntity> {
    const otp: OtpEntity = {
      id: this.nextId++,
      user_id: userId,
      otp_code: otpCode,
      expires_at: expiresAt,
      is_verified: false,
      created_at: new Date(),
    };
    this.otps.push(otp);
    return otp;
  }

  async findLatestOtp(userId: number): Promise<OtpEntity | null> {
    const list = this.otps.filter((o) => o.user_id === userId);
    return list.length ? list[list.length - 1] : null;
  }

  async markOtpAsVerified(id: number): Promise<void> {
    const o = this.otps.find((item) => item.id === id);
    if (o) o.is_verified = true;
  }

  async invalidatePreviousOtps(userId: number): Promise<void> {
    this.otps = this.otps.filter((o) => o.user_id !== userId);
  }
}

class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<string, SessionEntity> = new Map();

  async createSession(userId: number, refreshToken: string, expiresAt: Date): Promise<SessionEntity> {
    const s: SessionEntity = {
      id: String(Date.now()),
      user_id: userId,
      refresh_token: refreshToken,
      is_revoked: false,
      expires_at: expiresAt,
      created_at: new Date(),
    };
    this.sessions.set(refreshToken, s);
    return s;
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<SessionEntity | null> {
    return this.sessions.get(refreshToken) || null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    for (const [k, v] of Array.from(this.sessions.entries())) {
      if (v.id === sessionId || v.refresh_token === sessionId || k === sessionId) {
        v.is_revoked = true;
        this.sessions.delete(k);
      }
    }
  }

  async revokeAllUserSessions(userId: number): Promise<void> {
    for (const [k, v] of this.sessions.entries()) {
      if (v.user_id === userId) {
        this.sessions.delete(k);
      }
    }
  }

  async isSessionActive(refreshToken: string): Promise<boolean> {
    const s = this.sessions.get(refreshToken);
    return !!s && !s.is_revoked && s.expires_at > new Date();
  }
}

describe("Auth Module - End-to-End Integration Flow Tests", () => {
  let userRepo: InMemoryUserRepository;
  let otpRepo: InMemoryOtpRepository;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    otpRepo = new InMemoryOtpRepository();
    sessionRepo = new InMemorySessionRepository();
  });

  it("Full Journey 1: Register -> Verify OTP -> Login -> Refresh Token -> Logout", async () => {
    const registerUseCase = new RegisterUserUseCase(userRepo, otpRepo);
    const verifyOtpUseCase = new VerifyOtpUseCase(userRepo, otpRepo, sessionRepo);
    const loginUseCase = new LoginUserUseCase(userRepo, sessionRepo);
    const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, sessionRepo);
    const logoutUseCase = new LogoutUserUseCase(sessionRepo);

    // Step 1: Register
    const regRes = await registerUseCase.execute({
      profile_for: "Self",
      gender: "Female",
      first_name: "Amina",
      last_name: "M",
      cast: "Sunni",
      location: "Calicut",
      email: "amina@gmail.com",
      mobile_number: "+919111111111",
      password: "SecretPassword123!",
      dob: "1997-04-10",
    });

    expect(regRes.user.mobile_number).toBe("+919111111111");

    // Retrieve generated OTP
    const latestOtp = await otpRepo.findLatestOtp(regRes.user.id);
    expect(latestOtp).toBeDefined();

    // Step 2: Verify OTP
    const verifyRes = await verifyOtpUseCase.execute({
      mobile_number: "+919111111111",
      otp_code: latestOtp!.otp_code,
    });

    expect(verifyRes.user.status).toBe("active");
    expect(verifyRes.accessToken).toBeDefined();

    // Step 3: Login
    const loginRes = await loginUseCase.execute({
      mobile_number: "+919111111111",
      password: "SecretPassword123!",
    });

    expect(loginRes.accessToken).toBeDefined();
    expect(loginRes.refreshToken).toBeDefined();

    // Step 4: Refresh Token
    const refreshRes = await refreshTokenUseCase.execute(loginRes.refreshToken);
    expect(refreshRes.accessToken).toBeDefined();
    expect(refreshRes.refreshToken).toBeDefined();

    // Old refresh token rotated and revoked
    const isOldActive = await sessionRepo.isSessionActive(loginRes.refreshToken);
    expect(isOldActive).toBe(false);

    // Step 5: Logout
    await logoutUseCase.execute(refreshRes.refreshToken, loginRes.user.id);
    const isNewActive = await sessionRepo.isSessionActive(refreshRes.refreshToken);
    expect(isNewActive).toBe(false);
  });

  it("Full Journey 2: Forgot Password -> OTP -> Reset Password -> Immediately Login with New Password & Invalidate Old Sessions", async () => {
    const registerUseCase = new RegisterUserUseCase(userRepo, otpRepo);
    const verifyOtpUseCase = new VerifyOtpUseCase(userRepo, otpRepo, sessionRepo);
    const loginUseCase = new LoginUserUseCase(userRepo, sessionRepo);
    const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepo, otpRepo);
    const resetPasswordUseCase = new ResetPasswordUseCase(userRepo, otpRepo, sessionRepo);

    // Setup User
    const regRes = await registerUseCase.execute({
      profile_for: "Self",
      gender: "Male",
      first_name: "Bilal",
      last_name: "K",
      cast: "Sunni",
      location: "Malappuram",
      mobile_number: "+919222222222",
      password: "OldPassword123!",
      dob: "1994-08-20",
    });

    const regOtp = await otpRepo.findLatestOtp(regRes.user.id);
    await verifyOtpUseCase.execute({ mobile_number: "+919222222222", otp_code: regOtp!.otp_code });

    // Initial Login
    const oldLogin = await loginUseCase.execute({
      mobile_number: "+919222222222",
      password: "OldPassword123!",
    });
    expect(await sessionRepo.isSessionActive(oldLogin.refreshToken)).toBe(true);

    // Step 1: Forgot Password
    await forgotPasswordUseCase.execute({ mobile_number: "+919222222222" });
    const resetOtp = await otpRepo.findLatestOtp(regRes.user.id);

    // Step 2: Reset Password
    await resetPasswordUseCase.execute({
      mobile_number: "+919222222222",
      otp_code: resetOtp!.otp_code,
      new_password: "BrandNewPassword456!",
    });

    // Old session should be revoked!
    expect(await sessionRepo.isSessionActive(oldLogin.refreshToken)).toBe(false);

    // Old password should fail!
    await expect(
      loginUseCase.execute({
        mobile_number: "+919222222222",
        password: "OldPassword123!",
      })
    ).rejects.toThrow();

    // Step 3: Immediately Login with New Password!
    const newLogin = await loginUseCase.execute({
      mobile_number: "+919222222222",
      password: "BrandNewPassword456!",
    });

    expect(newLogin.accessToken).toBeDefined();
    expect(newLogin.user.id).toBe(regRes.user.id);
  });
});
