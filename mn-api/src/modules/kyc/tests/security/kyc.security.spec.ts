import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";

describe("KYC Module - Security & Authorization Tests", () => {
  const normalUserToken = generateToken({ userId: 10, role: "USER", isAdmin: false });
  const adminToken = generateToken({ userId: 999, role: "ADMIN", isAdmin: true });

  it("should block unauthenticated requests to POST /user/kyc/submit", async () => {
    const res = await request(app).post("/user/kyc/submit").send({});
    expect(res.status).toBe(401);
  });

  it("should block non-admin users from approving KYC applications", async () => {
    const res = await request(app)
      .post("/user/kyc/admin/approve/10")
      .set("Authorization", `Bearer ${normalUserToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("should block non-admin users from rejecting KYC applications", async () => {
    const res = await request(app)
      .post("/user/kyc/admin/reject/10")
      .set("Authorization", `Bearer ${normalUserToken}`)
      .send({ reason: "Unauthorized attempt" });
    expect(res.status).toBe(403);
  });
});
