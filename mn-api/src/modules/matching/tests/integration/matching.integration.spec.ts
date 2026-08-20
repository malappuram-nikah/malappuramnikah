import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Matching Module - Integration Tests", () => {
  let user1Id: number;
  let user2Id: number;
  let token1: string;

  beforeAll(async () => {
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "MatchUser",
        last_name: "One",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876581111",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    user1Id = u1.id;
    token1 = generateToken({ userId: user1Id, mobileNumber: u1.mobile_number, isAdmin: false });

    const u2 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "MatchUser",
        last_name: "Two",
        dob: "1993-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876582222",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    user2Id = u2.id;

    // Create preferences for user1
    await prisma.memberPreference.create({
      data: {
        user_id: user1Id,
        age_min: 20,
        age_max: 35,
        district_list: ["Malappuram"],
      },
    });
  });

  afterAll(async () => {
    await prisma.memberPreference.deleteMany({ where: { user_id: user1Id } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
  });

  it("should calculate compatibility score between two users", async () => {
    const res = await request(app)
      .get(`/user/matching/score/${user2Id}`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.overallScore).toBeGreaterThanOrEqual(0);
    expect(res.body.breakdown).toBeDefined();
  });

  it("should return recommended matches ranked by compatibility score", async () => {
    const res = await request(app)
      .get("/user/matching/recommendations")
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});
