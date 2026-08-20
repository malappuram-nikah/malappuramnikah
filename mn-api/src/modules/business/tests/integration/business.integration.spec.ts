import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Business Module - Integration Tests", () => {
  let ownerId: number;
  let customerId: number;
  let ownerToken: string;
  let customerToken: string;
  let categoryId: number;
  let businessId: number;
  let bookingId: number;

  beforeAll(async () => {
    // 1. Create Business Owner user
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "BizOwner",
        last_name: "Test",
        dob: "1990-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876543001",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    ownerId = u1.id;
    ownerToken = generateToken({ userId: ownerId, mobileNumber: u1.mobile_number, isAdmin: false });

    // 2. Create Customer user
    const u2 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "Customer",
        last_name: "Test",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876543002",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    customerId = u2.id;
    customerToken = generateToken({ userId: customerId, mobileNumber: u2.mobile_number, isAdmin: false });

    // 3. Create category
    const cat = await prisma.businessCategory.create({
      data: { name: "Photography Integration Test", description: "Wedding Photography" },
    });
    categoryId = cat.id;
  });

  afterAll(async () => {
    if (businessId) {
      await prisma.businessReview.deleteMany({ where: { business_id: businessId } });
      await prisma.businessBooking.deleteMany({ where: { business_id: businessId } });
      await prisma.businessOffer.deleteMany({ where: { business_id: businessId } });
      await prisma.businessWork.deleteMany({ where: { business_id: businessId } });
      await prisma.businessMedia.deleteMany({ where: { business_id: businessId } });
      await prisma.businessProfile.deleteMany({ where: { id: businessId } });
    }
    if (categoryId) {
      await prisma.businessCategory.delete({ where: { id: categoryId } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, customerId] } } });
  });

  it("should complete full business lifecycle: profile -> portfolio -> offer -> booking -> complete -> review -> leaderboard", async () => {
    // 1. Create Business Profile
    const profileRes = await request(app)
      .post("/user/profile")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        categoryId,
        businessName: "Malappuram Studio",
        description: "Best wedding photography",
        experienceYears: 5,
        location: "Malappuram",
        monetizationModel: "COMMISSION",
      });

    expect(profileRes.status).toBe(201);
    expect(profileRes.body.id).toBeDefined();
    businessId = profileRes.body.id;

    // 2. Add Portfolio Work
    const workRes = await request(app)
      .post("/user/work")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        businessId,
        title: "Royal Wedding 2026",
        description: "Highlights of destination wedding",
        mediaUrls: ["https://example.com/photo1.jpg"],
      });

    expect(workRes.status).toBe(201);
    expect(workRes.body.title).toBe("Royal Wedding 2026");

    // 3. Create Offer
    const offerRes = await request(app)
      .post("/user/offers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        businessId,
        title: "Monsoon Wedding Discount",
        price: 20000,
        discountedPrice: 18000,
        validityFrom: "2026-01-01",
        validityTo: "2026-12-31",
      });

    expect(offerRes.status).toBe(201);

    // 4. Customer Creates Booking (Gross 18000)
    const bookingRes = await request(app)
      .post("/user/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        businessId,
        bookingDate: "2026-09-15",
        grossAmount: 18000,
      });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.commission_amount).toBe(900); // 5% of 18000 = 900
    expect(bookingRes.body.business_amount).toBe(17100);
    bookingId = bookingRes.body.id;

    // 5. Owner Confirms and Completes Booking
    await request(app)
      .put(`/user/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "CONFIRMED" });

    const completeRes = await request(app)
      .put(`/user/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "COMPLETED" });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe("COMPLETED");

    // 6. Customer Submits Review
    const reviewRes = await request(app)
      .post("/user/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        businessId,
        bookingId,
        rating: 5,
        subject: "Excellent Service!",
        comment: "Loved the photography service.",
      });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.rating).toBe(5);

    // 7. Check Leaderboard
    const leaderboardRes = await request(app).get(`/user/leaderboard/${categoryId}`);
    expect(leaderboardRes.status).toBe(200);
    expect(leaderboardRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(leaderboardRes.body.data[0].business.id).toBe(businessId);
  });
});
