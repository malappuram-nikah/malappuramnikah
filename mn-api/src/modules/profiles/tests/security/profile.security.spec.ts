import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";

describe("Profile Module Security & Authorization Tests", () => {
  const tokenUser1 = generateToken({ userId: 1, role: "USER", isAdmin: false });

  it("should block unauthenticated requests to GET /user/profile", async () => {
    const res = await request(app).get("/user/profile");
    expect(res.status).toBe(401);
  });

  it("should allow authenticated user to fetch their own profile", async () => {
    const res = await request(app)
      .get("/user/profile")
      .set("Authorization", `Bearer ${tokenUser1}`);
    
    // Status can be 200 or 404 depending on database record presence
    expect([200, 404]).toContain(res.status);
  });
});
