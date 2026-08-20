import { UpdateBasicDetailsUseCase } from "../../application/use-cases/UpdateBasicDetails.usecase";
import { UpdateLocationDetailsUseCase } from "../../application/use-cases/UpdateLocationDetails.usecase";
import { GetProfileUseCase } from "../../application/use-cases/GetProfile.usecase";
import { IProfileRepository, FullProfileResult } from "../../domain/repositories/IProfileRepository";

class MockIsolatedProfileRepo implements IProfileRepository {
  public data: FullProfileResult = {
    userId: 55,
    profile: { first_name: "OriginalFirst", last_name: "OriginalLast", marital_status: "Single" },
    location: { district: "Palakkad", state: "Kerala" },
    completionScore: 50,
    completionBreakdown: {},
  } as any;

  async getFullProfile(userId: number): Promise<FullProfileResult | null> {
    return this.data;
  }
  async findById(): Promise<any> { return null; }
  async findProfiles(): Promise<any[]> { return []; }
  async updateProfile(): Promise<any> { return {}; }
  async deleteUser(): Promise<void> {}
  async getPublicStats(): Promise<any> { return {}; }

  async updateBasicDetails(userId: number, data: any): Promise<void> {
    this.data.profile = { ...this.data.profile, ...data };
  }
  async updateLocationDetails(userId: number, data: any): Promise<void> {
    this.data.location = { ...this.data.location, ...data };
  }
  async updateEducationDetails(): Promise<void> {}
  async updateOccupationDetails(): Promise<void> {}
  async updateFamilyDetails(): Promise<void> {}
  async updatePreferences(): Promise<void> {}
  async updatePrivacySettings(): Promise<void> {}
  async addProfileMedia(): Promise<any> { return {}; }
  async deleteProfileMedia(): Promise<boolean> { return true; }
  async setPrimaryMedia(): Promise<boolean> { return true; }
}

describe("Profile Module Regression Tests (Field Isolation)", () => {
  let repo: MockIsolatedProfileRepo;
  let updateBasic: UpdateBasicDetailsUseCase;
  let updateLocation: UpdateLocationDetailsUseCase;
  let getProfile: GetProfileUseCase;

  beforeEach(() => {
    repo = new MockIsolatedProfileRepo();
    updateBasic = new UpdateBasicDetailsUseCase(repo);
    updateLocation = new UpdateLocationDetailsUseCase(repo);
    getProfile = new GetProfileUseCase(repo);
  });

  it("should ensure sectional updates do NOT overwrite unrelated section fields", async () => {
    // 1. Update basic details
    await updateBasic.execute({ userId: 55, first_name: "NewFirst" });
    
    let current = await getProfile.execute(55);
    expect(current.profile?.first_name).toBe("NewFirst");
    expect(current.profile?.last_name).toBe("OriginalLast"); // Unchanged
    expect(current.location?.district).toBe("Palakkad"); // Unchanged

    // 2. Update location details
    await updateLocation.execute({ userId: 55, city: "Chittur" });

    current = await getProfile.execute(55);
    expect(current.profile?.first_name).toBe("NewFirst"); // Still intact!
    expect(current.location?.city).toBe("Chittur");
    expect(current.location?.district).toBe("Palakkad"); // Still intact!
  });
});
