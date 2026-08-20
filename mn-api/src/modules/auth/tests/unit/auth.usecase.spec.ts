import { RegisterUserUseCase } from "../../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../../application/use-cases/LoginUser.usecase";
import { SendOtpUseCase } from "../../application/use-cases/SendOtp.usecase";
import { VerifyOtpUseCase } from "../../application/use-cases/VerifyOtp.usecase";
import { ResetPasswordUseCase } from "../../application/use-cases/ResetPassword.usecase";
import { RefreshTokenUseCase } from "../../application/use-cases/RefreshToken.usecase";
import { LogoutUserUseCase } from "../../application/use-cases/LogoutUser.usecase";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import bcrypt from "bcryptjs";

describe("Auth Module - Unit Tests", () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockOtpRepo: jest.Mocked<IOtpRepository>;
  let mockSessionRepo: jest.Mocked<ISessionRepository>;

  beforeEach(() => {
    mockUserRepo = {
      createUser: jest.fn(),
      findByMobileNumber: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateUser: jest.fn(),
      updatePassword: jest.fn(),
      updateStatus: jest.fn(),
      updateLastLogin: jest.fn(),
    };
    mockOtpRepo = {
      createOtp: jest.fn(),
      findLatestOtp: jest.fn(),
      markOtpAsVerified: jest.fn(),
      invalidatePreviousOtps: jest.fn(),
    };
    mockSessionRepo = {
      createSession: jest.fn(),
      findSessionByRefreshToken: jest.fn(),
      revokeSession: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      isSessionActive: jest.fn(),
    };
  });

  describe("Registration & Duplicate Account", () => {
    it("should perform valid registration when Gmail address is valid", async () => {
      const useCase = new RegisterUserUseCase(mockUserRepo, mockOtpRepo);
      mockUserRepo.findByMobileNumber.mockResolvedValue(null);
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.createUser.mockResolvedValue({
        id: 1,
        mobile_number: "+919876543210",
        email: "test@gmail.com",
        first_name: "Ali",
        last_name: "K",
        gender: "Male",
        status: "in_active",
      } as any);
      mockOtpRepo.createOtp.mockResolvedValue({} as any);

      const res = await useCase.execute({
        profile_for: "Self",
        gender: "Male",
        first_name: "Ali",
        last_name: "K",
        cast: "Sunni",
        location: "Malappuram",
        email: "test@gmail.com",
        mobile_number: "+919876543210",
        password: "Password123!",
        dob: "1995-05-15",
      });

      expect(res.user.mobile_number).toBe("+919876543210");
      expect(mockOtpRepo.createOtp).toHaveBeenCalled();
    });

    it("should throw ConflictError when registering duplicate account", async () => {
      const useCase = new RegisterUserUseCase(mockUserRepo, mockOtpRepo);
      mockUserRepo.findByMobileNumber.mockResolvedValue({ id: 1 } as any);

      await expect(
        useCase.execute({
          profile_for: "Self",
          gender: "Male",
          first_name: "Ali",
          last_name: "K",
          cast: "Sunni",
          location: "Malappuram",
          mobile_number: "+919876543210",
          password: "Password123!",
          dob: "1995-05-15",
        })
      ).rejects.toThrow("User with this mobile number already exists.");
    });
  });

  describe("Login & Invalid Password", () => {
    it("should perform valid login and return token pair", async () => {
      const useCase = new LoginUserUseCase(mockUserRepo, mockSessionRepo);
      const hashedPassword = await bcrypt.hash("CorrectPass123", 10);
      mockUserRepo.findByMobileNumber.mockResolvedValue({
        id: 1,
        mobile_number: "+919876543210",
        password: hashedPassword,
        status: "active",
      } as any);
      mockSessionRepo.createSession.mockResolvedValue({} as any);

      const res = await useCase.execute({
        mobile_number: "+919876543210",
        password: "CorrectPass123",
      });

      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
    });

    it("should throw UnauthorizedError for invalid password", async () => {
      const useCase = new LoginUserUseCase(mockUserRepo, mockSessionRepo);
      const hashedPassword = await bcrypt.hash("CorrectPass123", 10);
      mockUserRepo.findByMobileNumber.mockResolvedValue({
        id: 1,
        mobile_number: "+919876543210",
        password: hashedPassword,
        status: "active",
      } as any);

      await expect(
        useCase.execute({
          mobile_number: "+919876543210",
          password: "WrongPassword",
        })
      ).rejects.toThrow("Invalid mobile number/email or password.");
    });
  });

  describe("OTP Verification & Expiry & Limits", () => {
    it("should throw error for expired OTP", async () => {
      const useCase = new VerifyOtpUseCase(mockUserRepo, mockOtpRepo, mockSessionRepo);
      mockUserRepo.findByMobileNumber.mockResolvedValue({ id: 1, mobile_number: "+919876543210" } as any);
      mockOtpRepo.findLatestOtp.mockResolvedValue({
        id: 1,
        otp_code: "123456",
        expires_at: new Date(Date.now() - 1000), // Expired
        is_verified: false,
      } as any);

      await expect(
        useCase.execute({ mobile_number: "+919876543210", otp_code: "123456" })
      ).rejects.toThrow("OTP has expired. Please request a new OTP.");
    });

    it("should throw error for invalid OTP code", async () => {
      const useCase = new VerifyOtpUseCase(mockUserRepo, mockOtpRepo, mockSessionRepo);
      mockUserRepo.findByMobileNumber.mockResolvedValue({ id: 1, mobile_number: "+919876543210" } as any);
      mockOtpRepo.findLatestOtp.mockResolvedValue({
        id: 1,
        otp_code: "123456",
        expires_at: new Date(Date.now() + 60000),
        is_verified: false,
      } as any);

      await expect(
        useCase.execute({ mobile_number: "+919876543210", otp_code: "999999" })
      ).rejects.toThrow("Invalid OTP code.");
    });
  });

  describe("Password Reset & Session Revocation", () => {
    it("should reset password and invalidate all active sessions", async () => {
      const useCase = new ResetPasswordUseCase(mockUserRepo, mockOtpRepo, mockSessionRepo);
      mockUserRepo.findByMobileNumber.mockResolvedValue({ id: 1, mobile_number: "+919876543210" } as any);
      mockOtpRepo.findLatestOtp.mockResolvedValue({
        id: 1,
        otp_code: "123456",
        expires_at: new Date(Date.now() + 60000),
        is_verified: false,
      } as any);

      const res = await useCase.execute({
        mobile_number: "+919876543210",
        otp_code: "123456",
        new_password: "NewPassword123!",
      });

      expect(res.message).toContain("Password reset successful");
      expect(mockUserRepo.updatePassword).toHaveBeenCalled();
      expect(mockSessionRepo.revokeAllUserSessions).toHaveBeenCalledWith(1);
    });

    it("should logout and revoke session", async () => {
      const useCase = new LogoutUserUseCase(mockSessionRepo);
      await useCase.execute("token123", 1);
      expect(mockSessionRepo.revokeSession).toHaveBeenCalledWith("token123");
      expect(mockSessionRepo.revokeAllUserSessions).toHaveBeenCalledWith(1);
    });
  });
});
