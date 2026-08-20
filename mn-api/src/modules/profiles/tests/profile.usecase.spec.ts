import { GetProfileUseCase } from "../application/use-cases/GetProfile.usecase";
import { UpdateBasicDetailsUseCase } from "../application/use-cases/UpdateBasicDetails.usecase";
import { UpdateEducationUseCase } from "../application/use-cases/UpdateEducation.usecase";
import { IProfileRepository, FullProfileResult } from "../domain/repositories/IProfileRepository";

describe("Profiles Module Usecases Suite", () => {
  let mockProfileRepo: jest.Mocked<IProfileRepository>;
  let getProfileUseCase: GetProfileUseCase;
  let updateBasicUseCase: UpdateBasicDetailsUseCase;
  let updateEducationUseCase: UpdateEducationUseCase;

  beforeEach(() => {
    mockProfileRepo = {
      getFullProfile: jest.fn(),
      findById: jest.fn(),
      findProfiles: jest.fn(),
      updateProfile: jest.fn(),
      deleteUser: jest.fn(),
      getPublicStats: jest.fn(),
      updateBasicDetails: jest.fn(),
      updateLocationDetails: jest.fn(),
      updateEducationDetails: jest.fn(),
      updateOccupationDetails: jest.fn(),
      updateFamilyDetails: jest.fn(),
      updatePreferences: jest.fn(),
      updatePrivacySettings: jest.fn(),
      addProfileMedia: jest.fn(),
      deleteProfileMedia: jest.fn(),
      setPrimaryMedia: jest.fn(),
    };

    getProfileUseCase = new GetProfileUseCase(mockProfileRepo);
    updateBasicUseCase = new UpdateBasicDetailsUseCase(mockProfileRepo);
    updateEducationUseCase = new UpdateEducationUseCase(mockProfileRepo);
  });

  it("should get full profile correctly", async () => {
    const mockRes: FullProfileResult = {
      userId: 1,
      completionScore: 85,
      completionBreakdown: {},
      profile: { first_name: "TestUser" },
    } as any;

    mockProfileRepo.getFullProfile.mockResolvedValue(mockRes);

    const res = await getProfileUseCase.execute(1);
    expect(res.userId).toBe(1);
    expect(res.completionScore).toBe(85);
  });

  it("should update basic details", async () => {
    mockProfileRepo.updateBasicDetails.mockResolvedValue();
    const res = await updateBasicUseCase.execute({ userId: 1, first_name: "NewName" });
    expect(res.message).toBe("Basic profile details updated successfully.");
    expect(mockProfileRepo.updateBasicDetails).toHaveBeenCalledWith(1, { userId: 1, first_name: "NewName" });
  });

  it("should update education details", async () => {
    mockProfileRepo.updateEducationDetails.mockResolvedValue();
    const res = await updateEducationUseCase.execute({ userId: 1, highest_education: "Master's" });
    expect(res.message).toBe("Education details updated successfully.");
    expect(mockProfileRepo.updateEducationDetails).toHaveBeenCalledWith(1, { userId: 1, highest_education: "Master's" });
  });
});
