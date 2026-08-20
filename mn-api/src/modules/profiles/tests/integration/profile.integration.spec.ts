import { PrismaProfileRepository } from "../../infrastructure/repositories/PrismaProfileRepository";
import { UpdateBasicDetailsUseCase } from "../../application/use-cases/UpdateBasicDetails.usecase";
import { UpdateLocationDetailsUseCase } from "../../application/use-cases/UpdateLocationDetails.usecase";
import { GetProfileUseCase } from "../../application/use-cases/GetProfile.usecase";
import { prisma } from "../../../../infrastructure/database/prisma.service";

describe("Profile Module Integration Tests", () => {
  const repository = new PrismaProfileRepository();
  const getProfileUseCase = new GetProfileUseCase(repository);
  const updateBasicDetailsUseCase = new UpdateBasicDetailsUseCase(repository);
  const updateLocationDetailsUseCase = new UpdateLocationDetailsUseCase(repository);

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
      await prisma.memberProfile.deleteMany({ where: { user_id: testUserId } });
      await prisma.memberLocation.deleteMany({ where: { user_id: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
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
});
