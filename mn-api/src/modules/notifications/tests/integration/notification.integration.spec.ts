import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Notifications Module - Integration Tests", () => {
  let userId: number;
  let token: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "NotifUser",
        last_name: "Test",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876561111",
        password: "hashedpassword123",
        status: "ACTIVE",
      },
    });
    userId = user.id;
    token = generateToken({ userId, mobileNumber: user.mobile_number, isAdmin: false });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { user_id: userId } });
    await prisma.notificationPreference.deleteMany({ where: { user_id: userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("should complete notification create -> list -> read -> preferences flow", async () => {
    // 1. Create Notification
    const createRes = await request(app)
      .post("/user/notifications/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ user_id: userId, title: "Test Title", message: "Test Message", type: "SYSTEM" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.title).toBe("Test Title");

    const notifId = createRes.body.id;

    // 2. Get Notifications List
    const listRes = await request(app)
      .get("/user/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    // 3. Mark Single Notification as Read
    const readRes = await request(app)
      .post(`/user/notifications/read/${notifId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(readRes.status).toBe(200);

    // 4. Update Preferences
    const prefRes = await request(app)
      .put("/user/notifications/preferences")
      .set("Authorization", `Bearer ${token}`)
      .send({ emailNotifications: false, pushNotifications: true });

    expect(prefRes.status).toBe(200);
    expect(prefRes.body.email_notifications).toBe(false);
  });
});
