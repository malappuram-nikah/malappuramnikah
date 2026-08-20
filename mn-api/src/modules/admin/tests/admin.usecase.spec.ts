import { AdminLoginUseCase } from "../application/use-cases/AdminLogin.usecase";
import { UpdateUserAccountStatusUseCase } from "../application/use-cases/UpdateUserAccountStatus.usecase";
import { ToggleUserPremiumUseCase } from "../application/use-cases/ToggleUserPremium.usecase";
import { IAdminRepository } from "../domain/repositories/IAdminRepository";
import bcrypt from "bcryptjs";

describe("Admin Module - Use Cases", () => {
  let mockAdminRepo: jest.Mocked<IAdminRepository>;

  beforeEach(() => {
    mockAdminRepo = {
      findAdminByEmail: jest.fn(),
      findAdminByMobile: jest.fn(),
      findAdminById: jest.fn(),
      seedAdmin: jest.fn(),
      getAdminStats: jest.fn(),
      getAdminUsers: jest.fn(),
      getAdminUserById: jest.fn(),
      updateUserStatus: jest.fn(),
      updateUserKycVerification: jest.fn(),
      toggleUserPremium: jest.fn(),
      getAdminStoreData: jest.fn(),
      saveAdminStoreData: jest.fn(),
    };
  });

  describe("AdminLoginUseCase", () => {
    it("should authenticate valid admin by email", async () => {
      const useCase = new AdminLoginUseCase(mockAdminRepo);
      const hashedPassword = await bcrypt.hash("Harism@123", 10);
      mockAdminRepo.seedAdmin.mockResolvedValue({
        id: 1,
        name: "Haris",
        email: "harisvkvnr@gmail.com",
        mobile_number: "+911212121212",
        role: "SUPER_ADMIN",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      mockAdminRepo.findAdminByEmail.mockResolvedValue({
        id: 1,
        name: "Haris",
        email: "harisvkvnr@gmail.com",
        mobile_number: "+911212121212",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await useCase.execute({
        email: "harisvkvnr@gmail.com",
        password: "Harism@123",
      });

      expect(res.accessToken).toBeDefined();
      expect(res.admin.email).toBe("harisvkvnr@gmail.com");
    });

    it("should throw UnauthorizedError for incorrect password", async () => {
      const useCase = new AdminLoginUseCase(mockAdminRepo);
      const hashedPassword = await bcrypt.hash("CorrectPass", 10);
      mockAdminRepo.findAdminByEmail.mockResolvedValue({
        id: 1,
        name: "Admin",
        email: "admin@test.com",
        mobile_number: "+919999999999",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(
        useCase.execute({
          email: "admin@test.com",
          password: "WrongPassword",
        })
      ).rejects.toThrow("Invalid admin email or password.");
    });
  });

  describe("UpdateUserAccountStatusUseCase", () => {
    it("should update user status to suspended", async () => {
      const useCase = new UpdateUserAccountStatusUseCase(mockAdminRepo);
      mockAdminRepo.updateUserStatus.mockResolvedValue({
        id: 10,
        status: "suspended",
      });

      const res = await useCase.execute(10, "suspend");
      expect(res.status).toBe("suspended");
      expect(mockAdminRepo.updateUserStatus).toHaveBeenCalledWith(10, "suspended");
    });
  });

  describe("ToggleUserPremiumUseCase", () => {
    it("should toggle premium status and log activity", async () => {
      const useCase = new ToggleUserPremiumUseCase(mockAdminRepo);
      mockAdminRepo.toggleUserPremium.mockResolvedValue(true);
      mockAdminRepo.getAdminStoreData.mockReturnValue({ activity_logs: [] });
      mockAdminRepo.saveAdminStoreData.mockImplementation(() => {});

      const isPremium = await useCase.execute(10, "Haris Admin");
      expect(isPremium).toBe(true);
      expect(mockAdminRepo.saveAdminStoreData).toHaveBeenCalled();
    });
  });
});
