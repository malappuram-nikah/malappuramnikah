import bcrypt from "bcryptjs";
import { RegisterUserUseCase } from "../../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../../application/use-cases/LoginUser.usecase";
import { ForgotPasswordUseCase } from "../../application/use-cases/ForgotPassword.usecase";
import { VerifyOtpUseCase } from "../../application/use-cases/VerifyOtp.usecase";
import { ResetPasswordUseCase } from "../../application/use-cases/ResetPassword.usecase";
import { ChangePasswordUseCase } from "../../application/use-cases/ChangePassword.usecase";
import { UserEntity } from "../../domain/entities/user.entity";
import { OtpEntity } from "../../domain/entities/otp.entity";
import { SessionEntity } from "../../domain/entities/session.entity";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";

class MockUserRepo implements IUserRepository {
  public users: Map<number, UserEntity> = new Map();
  private nextId = 1;

  async findById(id: number): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const u of this.users.values()) {
      if (u.email?.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }
  async findByMobileNumber(mobile: string): Promise<UserEntity | null> {
    for (const u of this.users.values()) {
      if (u.mobile_number === mobile) return u;
    }
    return null;
  }
  async create(data: any): Promise<UserEntity> {
    const user: UserEntity = {
      id: this.nextId++,
      uuid: "uuid-" + Math.random(),
      profile_for: data.profile_for,
      gender: data.gender,
      first_name: data.first_name,
      last_name: data.last_name,
      cast: data.cast,
      location: data.location,
      email: data.email,
      mobile_number: data.mobile_number,
      password: data.password,
      dob: data.dob,
      status: "in_active",
      is_premium: false,
      is_new_user: true,
      referral_points: 0,
      kyc_status: "NOT_SUBMITTED",
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }
  async createUser(data: any): Promise<UserEntity> {
    return this.create(data);
  }
  async updateUser(id: number, data: any): Promise<UserEntity> {
    const u = this.users.get(id)!;
    Object.assign(u, data);
    return u;
  }
  async updateStatus(id: number, status: string): Promise<void> {
    const u = this.users.get(id)!;
    if (u) u.status = status;
  }
  async updatePassword(id: number, passwordHash: string): Promise<void> {
    const u = this.users.get(id)!;
    if (u) u.password = passwordHash;
  }
  async updateEmail(id: number, email: string): Promise<void> {
    const u = this.users.get(id)!;
    if (u) u.email = email;
  }
  async updateLastLogin(id: number): Promise<void> {
    const u = this.users.get(id)!;
    if (u) u.last_login = new Date();
  }
}

class MockOtpRepo implements IOtpRepository {
  public otps: OtpEntity[] = [];
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
    const userOtps = this.otps.filter((o) => o.user_id === userId);
    return userOtps.length ? userOtps[userOtps.length - 1] : null;
  }
  async markOtpAsVerified(otpId: number): Promise<void> {
    const o = this.otps.find((x) => x.id === otpId);
    if (o) o.is_verified = true;
  }
  async invalidatePreviousOtps(userId: number): Promise<void> {
    this.otps.filter((o) => o.user_id === userId).forEach((o) => (o.is_verified = true));
  }
}

class MockSessionRepo implements ISessionRepository {
  public sessions: SessionEntity[] = [];

  async createSession(userId: number, refreshToken: string, expiresAt: Date): Promise<SessionEntity> {
    const s: SessionEntity = {
      id: "sess-" + Math.random(),
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      is_revoked: false,
      created_at: new Date(),
    };
    this.sessions.push(s);
    return s;
  }
  async findSessionByRefreshToken(refreshToken: string): Promise<SessionEntity | null> {
    return this.sessions.find((s) => s.refresh_token === refreshToken) || null;
  }
  async isSessionActive(refreshToken: string): Promise<boolean> {
    const s = await this.findSessionByRefreshToken(refreshToken);
    return !!s && !s.is_revoked && s.expires_at > new Date();
  }
  async revokeSession(refreshToken: string): Promise<void> {
    const s = await this.findSessionByRefreshToken(refreshToken);
    if (s) s.is_revoked = true;
  }
  async revokeAllUserSessions(userId: number): Promise<void> {
    this.sessions.filter((s) => s.user_id === userId).forEach((s) => (s.is_revoked = true));
  }
}

describe("Auth Module Regression & Security Test Suite", () => {
  let userRepo: MockUserRepo;
  let otpRepo: MockOtpRepo;
  let sessionRepo: MockSessionRepo;
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUserUseCase;
  let forgotPasswordUseCase: ForgotPasswordUseCase;
  let verifyOtpUseCase: VerifyOtpUseCase;
  let resetPasswordUseCase: ResetPasswordUseCase;
  let changePasswordUseCase: ChangePasswordUseCase;

  beforeEach(() => {
    userRepo = new MockUserRepo();
    otpRepo = new MockOtpRepo();
    sessionRepo = new MockSessionRepo();

    registerUseCase = new RegisterUserUseCase(userRepo, otpRepo);
    loginUseCase = new LoginUserUseCase(userRepo, sessionRepo);
    forgotPasswordUseCase = new ForgotPasswordUseCase(userRepo, otpRepo);
    verifyOtpUseCase = new VerifyOtpUseCase(userRepo, otpRepo, sessionRepo);
    resetPasswordUseCase = new ResetPasswordUseCase(userRepo, otpRepo, sessionRepo);
    changePasswordUseCase = new ChangePasswordUseCase(userRepo, sessionRepo);
  });

  it("should fail login on incorrect password", async () => {
    const passwordHash = await bcrypt.hash("CorrectPass123!", 10);
    await userRepo.create({
      profile_for: "Self",
      gender: "Male",
      first_name: "Ahmad",
      last_name: "Khan",
      cast: "Sunni",
      location: "Malappuram",
      mobile_number: "9876543210",
      password: passwordHash,
      dob: "1995-05-15",
    });

    await expect(
      loginUseCase.execute({ identifier: "9876543210", password: "WrongPassword" })
    ).rejects.toThrow("Invalid mobile number/email or password.");
  });

  it("should fail OTP verification on expired OTP", async () => {
    const passwordHash = await bcrypt.hash("Pass123!", 10);
    const user = await userRepo.create({
      profile_for: "Self",
      gender: "Male",
      first_name: "Ali",
      last_name: "V",
      cast: "Sunni",
      location: "Malappuram",
      mobile_number: "9876543211",
      password: passwordHash,
      dob: "1996-01-01",
    });

    // Create an expired OTP (1 minute ago)
    await otpRepo.createOtp(user.id, "123456", new Date(Date.now() - 60000));

    await expect(
      verifyOtpUseCase.execute({ mobile_number: "9876543211", otp_code: "123456" })
    ).rejects.toThrow("OTP has expired. Please request a new OTP.");
  });

  it("should fail OTP verification on already used/reused OTP", async () => {
    const passwordHash = await bcrypt.hash("Pass123!", 10);
    const user = await userRepo.create({
      profile_for: "Self",
      gender: "Male",
      first_name: "Usman",
      last_name: "K",
      cast: "Sunni",
      location: "Malappuram",
      mobile_number: "9876543212",
      password: passwordHash,
      dob: "1996-01-01",
    });

    const otp = await otpRepo.createOtp(user.id, "654321", new Date(Date.now() + 600000));
    await otpRepo.markOtpAsVerified(otp.id);

    await expect(
      verifyOtpUseCase.execute({ mobile_number: "9876543212", otp_code: "654321" })
    ).rejects.toThrow("This OTP has already been used.");
  });

  it("should complete forgot password -> OTP -> Reset -> Login with new password flow end-to-end", async () => {
    const passwordHash = await bcrypt.hash("OldPassword123!", 10);
    const user = await userRepo.create({
      profile_for: "Self",
      gender: "Male",
      first_name: "Bilal",
      last_name: "S",
      cast: "Sunni",
      location: "Malappuram",
      mobile_number: "9876543213",
      password: passwordHash,
      dob: "1994-04-04",
    });

    // 1. Request Forgot Password OTP
    const forgotRes = await forgotPasswordUseCase.execute({ mobile_number: "9876543213" });
    expect(forgotRes.message).toBeDefined();

    const latestOtp = await otpRepo.findLatestOtp(user.id);
    expect(latestOtp).toBeDefined();
    const otpCode = latestOtp!.otp_code;

    // 2. Reset Password using OTP
    const resetRes = await resetPasswordUseCase.execute({
      mobile_number: "9876543213",
      otp_code: otpCode,
      new_password: "NewSuperPassword123!",
    });
    expect(resetRes.message).toContain("Password reset successful");

    // 3. Login using old password should fail
    await expect(
      loginUseCase.execute({ identifier: "9876543213", password: "OldPassword123!" })
    ).rejects.toThrow("Invalid mobile number/email or password.");

    // 4. Login using new password should succeed
    const loginRes = await loginUseCase.execute({
      identifier: "9876543213",
      password: "NewSuperPassword123!",
    });
    expect(loginRes.accessToken).toBeDefined();
    expect(loginRes.refreshToken).toBeDefined();
  });

  it("should revoke all active user sessions when password is changed", async () => {
    const passwordHash = await bcrypt.hash("OldPass123!", 10);
    const user = await userRepo.create({
      profile_for: "Self",
      gender: "Female",
      first_name: "Fatima",
      last_name: "M",
      cast: "Sunni",
      location: "Malappuram",
      mobile_number: "9876543214",
      password: passwordHash,
      dob: "1997-07-07",
    });

    await sessionRepo.createSession(user.id, "active_token_1", new Date(Date.now() + 86400000));
    await sessionRepo.createSession(user.id, "active_token_2", new Date(Date.now() + 86400000));

    await changePasswordUseCase.execute({
      userId: user.id,
      oldPassword: "OldPass123!",
      newPassword: "BrandNewPassword123!",
    });

    expect(await sessionRepo.isSessionActive("active_token_1")).toBe(false);
    expect(await sessionRepo.isSessionActive("active_token_2")).toBe(false);
  });
});
