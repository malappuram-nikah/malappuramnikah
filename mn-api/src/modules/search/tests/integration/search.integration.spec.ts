import request from "supertest";
import app from "../../../../app";
import prisma from "../../../../shared/database/prisma";

describe("Search Module - Integration Tests", () => {
  let searchUser1Id: number;
  let searchUser2Id: number;

  beforeAll(async () => {
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "SearchFemale",
        last_name: "One",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876591111",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    searchUser1Id = u1.id;

    const u2 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "SearchMale",
        last_name: "Two",
        dob: "1990-01-01",
        cast: "Muslim",
        location: "Kozhikode",
        mobile_number: "9876592222",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    searchUser2Id = u2.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [searchUser1Id, searchUser2Id] } } });
  });

  it("should filter profiles by gender", async () => {
    const res = await request(app).get("/search/profiles").query({ gender: "Female" });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((item: any) => item.gender.toLowerCase() === "female")).toBe(true);
  });
});
