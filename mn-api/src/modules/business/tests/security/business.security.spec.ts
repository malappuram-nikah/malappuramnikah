import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Business Module - Security Tests", () => {
  let ownerId: number;
  let attackerId: number;
  let ownerToken: string;
  let attackerToken: string;
  let categoryId: number;
  let businessId: number;

  beforeAll(async () => {
    // 1. Create Business Owner
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "SecOwner",
        last_name: "Test",
        dob: "1990-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876544001",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    ownerId = u1.id;
    ownerToken = generateToken({ userId: ownerId, mobileNumber: u1.mobile_number, isAdmin: false });

    // 2. Create Attacker
    const u2 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "SecAttacker",
        last_name: "Test",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876544002",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    attackerId = u2.id;
    attackerToken = generateToken({ userId: attackerId, mobileNumber: u2.mobile_number, isAdmin: false });

    // 3. Create Category & Business
    const cat = await prisma.businessCategory.create({
      data: { name: "Security Testing Category" },
    });
    categoryId = cat.id;

    const biz = await prisma.businessProfile.create({
      data: {
        user_id: ownerId,
        category_id: categoryId,
        business_name: "Sec Studio",
        location: "Malappuram",
        status: "ACTIVE",
      },
    });
    businessId = biz.id;
  });

  afterAll(async () => {
    if (businessId) {
      await prisma.businessProfile.deleteMany({ where: { id: businessId } });
    }
    if (categoryId) {
      await prisma.businessCategory.delete({ where: { id: categoryId } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, attackerId] } } });
  });

  it("should prevent non-owner user from updating another user's business profile (IDOR)", async () => {
    const res = await request(app)
      .put(`/user/profile/${businessId}`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ business_name: "Hacked Studio Name" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Unauthorized: You are not the owner");
  });

  it("should prevent non-owner user from creating work under another business profile", async () => {
    const res = await request(app)
      .post("/user/work")
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({
        businessId,
        title: "Malicious Work",
      });

    expect(res.status).toBe(403);
  });

  it("should prevent fake review submission for non-existent or uncompleted booking", async () => {
    const res = await request(app)
      .post("/user/reviews")
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({
        businessId,
        bookingId: 999999, // Fake booking ID
        rating: 5,
        comment: "Fake review!",
      });

    expect(res.status).toBe(404);
  });

  it("should hide suspended business profiles from public view", async () => {
    // Suspend business
    await prisma.businessProfile.update({
      where: { id: businessId },
      data: { status: "SUSPENDED" },
    });

    const res = await request(app).get(`/user/profile/${businessId}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toContain("Business profile is currently unavailable.");
  });
});
