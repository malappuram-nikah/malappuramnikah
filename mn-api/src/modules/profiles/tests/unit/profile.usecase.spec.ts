import { ProfileCompletionCalculator } from "../../domain/services/ProfileCompletionCalculator";
import { GetProfileUseCase } from "../../application/use-cases/GetProfile.usecase";
import { UpdateBasicDetailsUseCase } from "../../application/use-cases/UpdateBasicDetails.usecase";
import { UpdateLocationDetailsUseCase } from "../../application/use-cases/UpdateLocationDetails.usecase";
import { IProfileRepository, FullProfileResult } from "../../domain/repositories/IProfileRepository";

class MockProfileRepo implements IProfileRepository {
  public mockProfile: FullProfileResult = {
    userId: 1,
    first_name: "Aisha",
    last_name: "R",
    dob: "1997-03-21",
    gender: "Female",
    marital_status: "Single",
    completionScore: 75,
    completionBreakdown: {},
    profile: { first_name: "Aisha", last_name: "R", dob: "1997-03-21", gender: "Female" },
    location: { district: "Malappuram", state: "Kerala" },
    education: [{ highest_education: "B.Tech" }],
    occupation: [{ profession: "Software Engineer" }],
    family: { family_status: "Middle Class" },
    preference: { age_min: 22, age_max: 30 },
    media: [{ url: "https://example.com/photo.jpg", is_primary: true }],
  } as any;

  async getFullProfile(userId: number): Promise<FullProfileResult | null> {
    return userId === 1 ? this.mockProfile : null;
  }
  async findById(): Promise<any> { return null; }
  async findProfiles(): Promise<any[]> { return []; }
  async updateProfile(): Promise<any> { return {}; }
  async deleteUser(): Promise<void> {}
  async getPublicStats(): Promise<any> { return {}; }

  async updateBasicDetails(userId: number, data: any): Promise<void> {
    if (this.mockProfile) Object.assign(this.mockProfile.profile!, data);
  }
  async updateLocationDetails(userId: number, data: any): Promise<void> {
    if (this.mockProfile) Object.assign(this.mockProfile.location!, data);
  }
  async updateEducationDetails(): Promise<void> {}
  async updateOccupationDetails(): Promise<void> {}
  async updateFamilyDetails(): Promise<void> {}
  async updatePreferences(): Promise<void> {}
  async updatePrivacySettings(): Promise<void> {}
  async addProfileMedia(userId: number, mediaData: any): Promise<any> {
    return { id: 10, ...mediaData };
  }
  async deleteProfileMedia(): Promise<boolean> { return true; }
  async setPrimaryMedia(): Promise<boolean> { return true; }
}

describe("Profile Module Unit Tests", () => {
  let profileRepo: MockProfileRepo;
  let getProfileUseCase: GetProfileUseCase;
  let updateBasicDetailsUseCase: UpdateBasicDetailsUseCase;

  beforeEach(() => {
    profileRepo = new MockProfileRepo();
    getProfileUseCase = new GetProfileUseCase(profileRepo);
    updateBasicDetailsUseCase = new UpdateBasicDetailsUseCase(profileRepo);
  });

  it("should calculate profile completion score correctly", () => {
    const scoreObj = ProfileCompletionCalculator.calculateScore({
      profile: { first_name: "Salim", last_name: "K", dob: "1994-02-02", marital_status: "Single" },
      location: { district: "Malappuram", state: "Kerala" },
      education: [{ highest_education: "M.Tech" }],
      occupation: [{ profession: "Doctor" }],
      family: { family_status: "Upper Middle Class", father_name: "Mustafa" },
      preference: { age_min: 20, age_max: 28, district_list: ["Malappuram"] },
      media: [{ url: "https://example.com/pic.jpg", is_primary: true }],
    });

    expect(scoreObj.totalScore).toBeGreaterThanOrEqual(80);
    expect(scoreObj.breakDown.basic).toBe(20);
    expect(scoreObj.breakDown.media).toBe(15);
  });

  it("should fetch profile by user id successfully", async () => {
    const profile = await getProfileUseCase.execute(1);
    expect(profile.userId).toBe(1);
    expect(profile.profile?.first_name).toBe("Aisha");
  });

  it("should update basic details cleanly", async () => {
    const res = await updateBasicDetailsUseCase.execute({
      userId: 1,
      first_name: "Fatima",
      marital_status: "Married",
    });
    expect(res.message).toBe("Basic profile details updated successfully.");

    const updated = await getProfileUseCase.execute(1);
    expect(updated.profile?.first_name).toBe("Fatima");
  });
});
