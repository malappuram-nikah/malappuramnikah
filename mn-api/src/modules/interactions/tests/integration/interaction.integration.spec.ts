import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Interactions Module - Integration Tests", () => {
  let user1Id: number;
  let user2Id: number;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    // Setup test users with required legacy fields
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "Test",
        last_name: "User1",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876541111",
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
        first_name: "Test",
        last_name: "User2",
        dob: "1993-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876542222",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    user2Id = u2.id;
    token2 = generateToken({ userId: user2Id, mobileNumber: u2.mobile_number, isAdmin: false });
  });

  afterAll(async () => {
    await prisma.interest.deleteMany({ where: { OR: [{ sender_id: user1Id }, { receiver_id: user1Id }] } });
    await prisma.block.deleteMany({ where: { OR: [{ blocker_id: user1Id }, { blocked_id: user1Id }] } });
    await prisma.favourite.deleteMany({ where: { OR: [{ favouriter_id: user1Id }, { favourited_id: user1Id }] } });
    await prisma.profileView.deleteMany({ where: { OR: [{ viewer_id: user1Id }, { viewed_id: user1Id }] } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
  });

  it("should complete interest send -> toggle favourite -> record view -> block user flow", async () => {
    // 1. Send Interest
    const sendRes = await request(app)
      .post("/user/interests/send")
      .set("Authorization", `Bearer ${token1}`)
      .send({ receiver_id: user2Id });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.status).toBe("PENDING");

    // 2. Toggle Favourite
    const favRes = await request(app)
      .post("/user/favourites/toggle")
      .set("Authorization", `Bearer ${token1}`)
      .send({ favourited_id: user2Id });

    expect(favRes.status).toBe(200);
    expect(favRes.body.isFavourited).toBe(true);

    // 3. Record Profile View
    const viewRes = await request(app)
      .post("/user/views/record")
      .set("Authorization", `Bearer ${token1}`)
      .send({ viewed_id: user2Id });

    expect(viewRes.status).toBe(200);

    // 4. Retrieve Interaction History
    const historyRes = await request(app)
      .get("/user/interactions/history")
      .set("Authorization", `Bearer ${token1}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.sentInterests).toHaveLength(1);

    // 5. Block User
    const blockRes = await request(app)
      .post("/user/blocks/block")
      .set("Authorization", `Bearer ${token1}`)
      .send({ blocked_id: user2Id });

    expect(blockRes.status).toBe(200);
    expect(blockRes.body.message).toBe("User blocked successfully.");
  });
});
