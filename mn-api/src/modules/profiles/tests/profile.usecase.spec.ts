import { GetProfilesUseCase } from "../application/use-cases/GetProfiles.usecase";
import { GetUserByIdUseCase } from "../application/use-cases/GetUserById.usecase";
import { DeleteUserUseCase } from "../application/use-cases/DeleteUser.usecase";
import { IProfileRepository } from "../domain/repositories/IProfileRepository";
import { ProfileEntity } from "../domain/entities/profile.entity";

describe("Profiles Module - Use Cases", () => {
  let mockProfileRepo: jest.Mocked<IProfileRepository>;

  beforeEach(() => {
    mockProfileRepo = {
      findById: jest.fn(),
      findProfiles: jest.fn(),
      updateProfile: jest.fn(),
      deleteUser: jest.fn(),
      getPublicStats: jest.fn(),
    };
  });

  describe("GetProfilesUseCase", () => {
    it("should restrict non-admin males to viewing female profiles only", async () => {
      const useCase = new GetProfilesUseCase(mockProfileRepo);
      mockProfileRepo.findById.mockResolvedValue({
        id: 1,
        gender: "Male",
      } as ProfileEntity);
      mockProfileRepo.findProfiles.mockResolvedValue([
        { id: 2, first_name: "Aysha", gender: "Female" } as ProfileEntity,
      ]);

      const result = await useCase.execute({}, 1, false);

      expect(mockProfileRepo.findProfiles).toHaveBeenCalledWith(
        expect.objectContaining({ gender: "female" })
      );
      expect(result.length).toBe(1);
    });
  });

  describe("GetUserByIdUseCase", () => {
    it("should throw ForbiddenError if non-admin tries to view same-gender profile", async () => {
      const useCase = new GetUserByIdUseCase(mockProfileRepo);
      mockProfileRepo.findById.mockImplementation(async (id) => {
        if (id === "1" || id === 1) return { id: 1, gender: "Male" } as ProfileEntity;
        if (id === "2" || id === 2) return { id: 2, gender: "Male" } as ProfileEntity;
        return null;
      });

      await expect(useCase.execute("2", 1, false)).rejects.toThrow(
        "Access forbidden. Same-gender profile visibility is restricted."
      );
    });

    it("should allow admin to view any user profile", async () => {
      const useCase = new GetUserByIdUseCase(mockProfileRepo);
      mockProfileRepo.findById.mockImplementation(async (id) => {
        if (id === "1" || id === 1) return { id: 1, gender: "Male" } as ProfileEntity;
        if (id === "2" || id === 2) return { id: 2, gender: "Male" } as ProfileEntity;
        return null;
      });

      const res = await useCase.execute("2", 1, true);
      expect(res.success).toBe(true);
      expect(res.user.id).toBe(2);
    });
  });

  describe("DeleteUserUseCase", () => {
    it("should prevent non-admin user from deleting another user profile", async () => {
      const useCase = new DeleteUserUseCase(mockProfileRepo);
      mockProfileRepo.findById.mockResolvedValue({
        id: 1,
        gender: "Male",
        profile_details: {},
      } as ProfileEntity);

      await expect(useCase.execute(2, 1, false)).rejects.toThrow(
        "Access forbidden. You can only delete your own profile."
      );
    });

    it("should allow user to delete their own profile", async () => {
      const useCase = new DeleteUserUseCase(mockProfileRepo);
      mockProfileRepo.findById.mockResolvedValue({
        id: 1,
        gender: "Male",
      } as ProfileEntity);
      mockProfileRepo.deleteUser.mockResolvedValue();

      await useCase.execute(1, 1, false);

      expect(mockProfileRepo.deleteUser).toHaveBeenCalledWith(1);
    });
  });
});
