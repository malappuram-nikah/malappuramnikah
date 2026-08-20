import { PrismaProfileRepository } from "../../infrastructure/repositories/PrismaProfileRepository";
import { UpdateBasicDetailsUseCase } from "../../application/use-cases/UpdateBasicDetails.usecase";
import { UpdateLocationDetailsUseCase } from "../../application/use-cases/UpdateLocationDetails.usecase";
import { UpdateEducationUseCase } from "../../application/use-cases/UpdateEducation.usecase";
import { UpdateOccupationUseCase } from "../../application/use-cases/UpdateOccupation.usecase";
import { UpdateFamilyDetailsUseCase } from "../../application/use-cases/UpdateFamilyDetails.usecase";
import { UpdatePreferencesUseCase } from "../../application/use-cases/UpdatePreferences.usecase";
import { UpdatePrivacySettingsUseCase } from "../../application/use-cases/UpdatePrivacySettings.usecase";
import { UploadProfileMediaUseCase } from "../../application/use-cases/UploadProfileMedia.usecase";
import { DeleteProfileMediaUseCase } from "../../application/use-cases/DeleteProfileMedia.usecase";
import { SetPrimaryMediaUseCase } from "../../application/use-cases/SetPrimaryMedia.usecase";
import { GetProfileUseCase } from "../../application/use-cases/GetProfile.usecase";
import { IStorageRepository, StorageUploadResult } from "../../../../shared/storage/IStorageRepository";
import { prisma } from "../../../../infrastructure/database/prisma.service";

class MockTestStorageRepository implements IStorageRepository {
  async uploadFile(fileData: string, folder?: string): Promise<StorageUploadResult> {
    return {
      url: `https://storage.test/uploads/${Date.now()}.png`,
      fileName: `test_${Date.now()}.png`,
      publicId: `test_id_${Date.now()}`,
      isCloudinary: false,
    };
  }
  async deleteFile(publicId: string): Promise<void> {}
  getPrivateUrl(fileName: string): string {
    return `https://storage.test/private/${fileName}`;
  }
}

describe("Profile Module Integration Tests", () => {
  const repository = new PrismaProfileRepository();
  const mockStorageRepository = new MockTestStorageRepository();

  const getProfileUseCase = new GetProfileUseCase(repository);
  const updateBasicDetailsUseCase = new UpdateBasicDetailsUseCase(repository);
  const updateLocationDetailsUseCase = new UpdateLocationDetailsUseCase(repository);
  const updateEducationUseCase = new UpdateEducationUseCase(repository);
  const updateOccupationUseCase = new UpdateOccupationUseCase(repository);
  const updateFamilyDetailsUseCase = new UpdateFamilyDetailsUseCase(repository);
  const updatePreferencesUseCase = new UpdatePreferencesUseCase(repository);
  const updatePrivacySettingsUseCase = new UpdatePrivacySettingsUseCase(repository);
  const uploadProfileMediaUseCase = new UploadProfileMediaUseCase(repository, mockStorageRepository);
  const deleteProfileMediaUseCase = new DeleteProfileMediaUseCase(repository);
  const setPrimaryMediaUseCase = new SetPrimaryMediaUseCase(repository);

  let testUserId: number;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "Mariam",
        last_name: "Z",
        cast: "Sunni",
        location: "Malappuram",
        mobile_number: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "hashedpassword123",
        dob: "1998-08-08",
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      try {
        await prisma.memberMedia.deleteMany({ where: { user_id: testUserId } });
        await prisma.memberPrivacy.deleteMany({ where: { user_id: testUserId } });
        await prisma.memberPreference.deleteMany({ where: { user_id: testUserId } });
        await prisma.memberFamily.deleteMany({ where: { user_id: testUserId } });
        await prisma.memberOccupation.deleteMany({ where: { user_id: testUserId } });
        await prisma.memberEducation.deleteMany({ where: { user_id: testUserId } });
        await prisma.memberLocation.deleteMany({ where: { user_id: testUserId } });
        await prisma.memberProfile.deleteMany({ where: { user_id: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
      } catch (err) {
        console.error("Integration test cleanup error:", err);
      }
    }
  });

  it("should update basic details and calculate score in database", async () => {
    await updateBasicDetailsUseCase.execute({
      userId: testUserId,
      first_name: "Mariam",
      last_name: "Zainab",
      marital_status: "Single",
    });

    await updateLocationDetailsUseCase.execute({
      userId: testUserId,
      district: "Malappuram",
      state: "Kerala",
      country: "India",
    });

    const profile = await getProfileUseCase.execute(testUserId);
    expect(profile.profile?.first_name).toBe("Mariam");
    expect(profile.location?.district).toBe("Malappuram");
    expect(profile.completionScore).toBeGreaterThan(0);
  });

  it("should update education, occupation, and family details", async () => {
    await updateEducationUseCase.execute({
      userId: testUserId,
      highest_education: "B.Tech",
      degree: "Computer Science",
      institution: "NIT Calicut",
    });

    await updateOccupationUseCase.execute({
      userId: testUserId,
      occupation_type: "Private",
      profession: "Senior Software Engineer",
      company_name: "Tech Corp",
      annual_income: "12 LPA",
    });

    await updateFamilyDetailsUseCase.execute({
      userId: testUserId,
      family_status: "Upper Middle Class",
      father_name: "Abdullah",
      mother_name: "Khadija",
    });

    const profile = await getProfileUseCase.execute(testUserId);
    expect(profile.education?.[0]?.highest_education).toBe("B.Tech");
    expect(profile.occupation?.[0]?.profession).toBe("Senior Software Engineer");
    expect(profile.family?.father_name).toBe("Abdullah");
  });

  it("should update partner preferences and privacy settings", async () => {
    await updatePreferencesUseCase.execute({
      userId: testUserId,
      age_min: 24,
      age_max: 30,
      district_list: ["Malappuram", "Kozhikode"],
    });

    await updatePrivacySettingsUseCase.execute({
      userId: testUserId,
      phone_privacy: "MATCHES_ONLY",
      photo_privacy: "PUBLIC",
    });

    const profile = await getProfileUseCase.execute(testUserId);
    expect(profile.preference?.age_min).toBe(24);
    expect(profile.privacy?.phone_privacy).toBe("MATCHES_ONLY");
  });

  it("should upload, set primary, and delete profile media", async () => {
    const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const media1 = await uploadProfileMediaUseCase.execute({
      userId: testUserId,
      fileData: dummyBase64,
      is_primary: true,
    });
    expect(media1.media).toBeDefined();

    const media2 = await uploadProfileMediaUseCase.execute({
      userId: testUserId,
      fileData: dummyBase64,
      is_primary: false,
    });
    expect(media2.media).toBeDefined();

    await setPrimaryMediaUseCase.execute(testUserId, media2.media.id);

    const profileAfterSetPrimary = await getProfileUseCase.execute(testUserId);
    const primaryMedia = profileAfterSetPrimary.media?.find((m: any) => m.id === media2.media.id);
    expect(primaryMedia?.is_primary).toBe(true);

    await deleteProfileMediaUseCase.execute(testUserId, media1.media.id);

    const profileAfterDelete = await getProfileUseCase.execute(testUserId);
    expect(profileAfterDelete.media?.some((m: any) => m.id === media1.media.id)).toBe(false);
  });
});
