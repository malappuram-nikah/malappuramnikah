import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Chat Module - Integration Tests", () => {
  let user1Id: number;
  let user2Id: number;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "ChatUser",
        last_name: "One",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876551111",
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
        first_name: "ChatUser",
        last_name: "Two",
        dob: "1993-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876552222",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    user2Id = u2.id;
    token2 = generateToken({ userId: user2Id, mobileNumber: u2.mobile_number, isAdmin: false });
  });

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { OR: [{ sender_id: user1Id }, { receiver_id: user1Id }] } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
  });

  it("should complete message sending -> get messages -> unread count -> mark read flow", async () => {
    // 1. Send Message from User 1 to User 2
    const sendRes = await request(app)
      .post("/user/chat/send")
      .set("Authorization", `Bearer ${token1}`)
      .send({ receiver_id: user2Id, content: "Hello from User 1!" });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.content).toBe("Hello from User 1!");

    // 2. User 2 checks unread count
    const unreadRes = await request(app)
      .get("/user/chat/unread-count")
      .set("Authorization", `Bearer ${token2}`);

    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.unreadCount).toBeGreaterThanOrEqual(1);

    // 3. User 2 retrieves messages with User 1
    const messagesRes = await request(app)
      .get(`/user/chat/messages/${user1Id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(messagesRes.status).toBe(200);
    expect(messagesRes.body.data.length).toBeGreaterThanOrEqual(1);

    // 4. User 2 marks messages as read
    const readRes = await request(app)
      .post(`/user/chat/read/${user1Id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(readRes.status).toBe(200);
  });
});
