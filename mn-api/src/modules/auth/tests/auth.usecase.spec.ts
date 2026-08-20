import { RegisterUserUseCase } from "../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../application/use-cases/LoginUser.usecase";
import { SendOtpUseCase } from "../application/use-cases/SendOtp.usecase";
import { VerifyOtpUseCase } from "../application/use-cases/VerifyOtp.usecase";
import { IUserRepository } from "../domain/repositories/IUserRepository";
import { IOtpRepository } from "../domain/repositories/IOtpRepository";
import { UserEntity } from "../domain/entities/user.entity";
import bcrypt from "bcryptjs";

describe("Auth Module - Use Cases", () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockOtpRepo: jest.Mocked<IOtpRepository>;

  beforeEach(() => {
    mockUserRepo = {
      createUser: jest.fn(),
      findByMobile: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateUser: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockOtpRepo = {
      createOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };
  });

  describe("RegisterUserUseCase", () => {
    it("should throw error if required field is missing", async () => {
      const useCase = new RegisterUserUseCase(mockUserRepo);
      await expect(
        useCase.execute({
          first_name: "Test",
          mobile_number: "+919876543210",
        })
      ).rejects.toThrow("Missing required field");
    });

    it("should throw error for invalid mobile number length", async () => {
      const useCase = new RegisterUserUseCase(mockUserRepo);
      await expect(
        useCase.execute({
          first_name: "Test",
          last_name: "User",
          mobile_number: "+9112345",
          password: "password123",
          location: "Malappuram",
          dob: "1995-01-01",
          cast: "Sunni",
          profile_for: "Self",
          gender: "Male",
        })
      ).rejects.toThrow("Indian mobile number must be exactly 10 digits");
    });

    it("should successfully register a valid new user", async () => {
      const useCase = new RegisterUserUseCase(mockUserRepo);
      mockUserRepo.findByMobile.mockResolvedValue(null);
      mockUserRepo.createUser.mockResolvedValue({
        id: 1,
        first_name: "Sinan",
        last_name: "K",
        mobile_number: "+919876543210",
        password: "hashedpassword",
        location: "Malappuram",
        dob: "1995-05-15",
        cast: "Sunni",
        profile_for: "Self",
        gender: "Male",
        status: "in_active",
        is_premium: false,
        is_new_user: true,
        kyc_status: "NOT_SUBMITTED",
        referral_points: 0,
      });

      const result = await useCase.execute({
        first_name: "Sinan",
        last_name: "K",
        mobile_number: "+919876543210",
        password: "password123",
        location: "Malappuram",
        dob: "1995-05-15",
        cast: "Sunni",
        profile_for: "Self",
        gender: "Male",
      });

      expect(result.id).toBe(1);
      expect(mockUserRepo.createUser).toHaveBeenCalled();
    });
  });

  describe("LoginUserUseCase", () => {
    it("should return 404 if user does not exist", async () => {
      const useCase = new LoginUserUseCase(mockUserRepo);
      mockUserRepo.findByMobile.mockResolvedValue(null);

      const res = await useCase.execute({
        mobile_number: "+919876543210",
        password: "password123",
      });

      expect(res.status).toBe(404);
      expect(res.message).toBe("User not found");
    });

    it("should return 403 if user status is in_active (unverified)", async () => {
      const useCase = new LoginUserUseCase(mockUserRepo);
      mockUserRepo.findByMobile.mockResolvedValue({
        id: 1,
        mobile_number: "+919876543210",
        password: "hashedpassword",
        status: "in_active",
      } as UserEntity);

      const res = await useCase.execute({
        mobile_number: "+919876543210",
        password: "password123",
      });

      expect(res.status).toBe(403);
      expect(res.code).toBe("ACCOUNT_UNVERIFIED");
    });

    it("should return 200 with JWT token for active user with correct password", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const useCase = new LoginUserUseCase(mockUserRepo);
      mockUserRepo.findByMobile.mockResolvedValue({
        id: 1,
        mobile_number: "+919876543210",
        password: hashedPassword,
        status: "active",
      } as UserEntity);
      mockUserRepo.updateUser.mockResolvedValue({} as UserEntity);

      const res = await useCase.execute({
        mobile_number: "+919876543210",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.token).toBeDefined();
    });
  });

  describe("VerifyOtpUseCase", () => {
    it("should verify correct OTP code", async () => {
      const useCase = new VerifyOtpUseCase(mockOtpRepo);
      mockOtpRepo.verifyOtp.mockResolvedValue(true);

      const isValid = await useCase.execute("+919876543210", "123456");
      expect(isValid).toBe(true);
      expect(mockOtpRepo.verifyOtp).toHaveBeenCalledWith("+919876543210", "123456");
    });

    it("should reject invalid OTP code", async () => {
      const useCase = new VerifyOtpUseCase(mockOtpRepo);
      mockOtpRepo.verifyOtp.mockResolvedValue(false);

      const isValid = await useCase.execute("+919876543210", "999999");
      expect(isValid).toBe(false);
    });
  });
});
