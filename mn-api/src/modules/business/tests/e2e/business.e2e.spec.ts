import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Business Module - E2E Test Suite", () => {
  let e2eOwnerId: number;
  let e2eMatrimonyUserId: number;
  let ownerToken: string;
  let matrimonyUserToken: string;
  let categoryId: number;
  let businessId: number;
  let bookingId: number;

  beforeAll(async () => {
    // 1. Register/Create Business User & Matrimony User
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "E2EBusinessUser",
        last_name: "Owner",
        dob: "1992-05-05",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876545001",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    e2eOwnerId = u1.id;
    ownerToken = generateToken({ userId: e2eOwnerId, mobileNumber: u1.mobile_number, isAdmin: false });

    const u2 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "E2EMatrimonyUser",
        last_name: "Customer",
        dob: "1996-06-06",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876545002",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    e2eMatrimonyUserId = u2.id;
    matrimonyUserToken = generateToken({ userId: e2eMatrimonyUserId, mobileNumber: u2.mobile_number, isAdmin: false });

    const cat = await prisma.businessCategory.create({
      data: { name: "E2E Event Decoration Category" },
    });
    categoryId = cat.id;
  });

  afterAll(async () => {
    if (businessId) {
      await prisma.businessReview.deleteMany({ where: { business_id: businessId } });
      await prisma.businessBooking.deleteMany({ where: { business_id: businessId } });
      await prisma.businessOffer.deleteMany({ where: { business_id: businessId } });
      await prisma.businessWork.deleteMany({ where: { business_id: businessId } });
      await prisma.businessProfile.deleteMany({ where: { id: businessId } });
    }
    if (categoryId) {
      await prisma.businessCategory.delete({ where: { id: categoryId } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [e2eOwnerId, e2eMatrimonyUserId] } } });
  });

  it("Full E2E Scenario: Business User -> Register/Login -> Create Profile -> Category -> Payment Model -> Portfolio -> Offer -> Matrimony User Views & Books -> Booking Completes -> Review -> Rating Updates -> Appears in Category Leaderboard", async () => {
    // 1. Create Business Profile with COMMISSION monetization model
    const profileRes = await request(app)
      .post("/user/profile")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        categoryId,
        businessName: "E2E Grand Decorators",
        description: "Premium wedding hall and stage decoration",
        location: "Malappuram",
        monetizationModel: "COMMISSION",
      });

    expect(profileRes.status).toBe(201);
    businessId = profileRes.body.id;

    // 2. Upload Portfolio Work
    const workRes = await request(app)
      .post("/user/work")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        businessId,
        title: "Stage Flower Setup 2026",
        description: "Floral entrance decor",
        mediaUrls: ["https://example.com/decor1.jpg"],
      });

    expect(workRes.status).toBe(201);

    // 3. Create Offer
    const offerRes = await request(app)
      .post("/user/offers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        businessId,
        title: "Wedding Package Promo",
        price: 50000,
        validityFrom: "2026-01-01",
        validityTo: "2026-12-31",
      });

    expect(offerRes.status).toBe(201);

    // 4. Matrimony User Views Public Profile
    const viewRes = await request(app).get(`/user/profile/${businessId}`);
    expect(viewRes.status).toBe(200);
    expect(viewRes.body.business_name).toBe("E2E Grand Decorators");

    // 5. Matrimony User Books Business
    const bookingRes = await request(app)
      .post("/user/bookings")
      .set("Authorization", `Bearer ${matrimonyUserToken}`)
      .send({
        businessId,
        bookingDate: "2026-11-20",
        grossAmount: 50000,
      });

    expect(bookingRes.status).toBe(201);
    bookingId = bookingRes.body.id;

    // 6. Owner Completes Booking
    await request(app)
      .put(`/user/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "CONFIRMED" });

    await request(app)
      .put(`/user/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "COMPLETED" });

    // 7. Matrimony User Submits Review
    const reviewRes = await request(app)
      .post("/user/reviews")
      .set("Authorization", `Bearer ${matrimonyUserToken}`)
      .send({
        businessId,
        bookingId,
        rating: 5,
        comment: "Outstanding decoration service!",
      });

    expect(reviewRes.status).toBe(201);

    // 8. Verify Rating Updates & Business Appears in Leaderboard
    const leaderboardRes = await request(app).get(`/user/leaderboard/${categoryId}`);
    expect(leaderboardRes.status).toBe(200);
    expect(leaderboardRes.body.data[0].business.average_rating).toBe(5.0);
    expect(leaderboardRes.body.data[0].business.total_reviews).toBe(1);
    expect(leaderboardRes.body.data[0].business.total_completed_bookings).toBe(1);
  });
});
