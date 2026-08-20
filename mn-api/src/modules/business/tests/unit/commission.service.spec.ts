import { CommissionCalculator } from "../../domain/services/CommissionCalculator";

describe("Business Module - CommissionCalculator Unit Tests", () => {
  it("should calculate correct commission for COMMISSION monetization model", () => {
    const result = CommissionCalculator.calculate(10000, "COMMISSION", 5.0);
    expect(result.grossAmount).toBe(10000);
    expect(result.commissionRate).toBe(5.0);
    expect(result.commissionAmount).toBe(500);
    expect(result.businessAmount).toBe(9500);
  });

  it("should calculate 0 commission for ONE_TIME monetization model", () => {
    const result = CommissionCalculator.calculate(10000, "ONE_TIME", 10.0);
    expect(result.grossAmount).toBe(10000);
    expect(result.commissionRate).toBe(0);
    expect(result.commissionAmount).toBe(0);
    expect(result.businessAmount).toBe(10000);
  });

  it("should throw error for negative gross amount", () => {
    expect(() => CommissionCalculator.calculate(-500, "COMMISSION")).toThrow("Gross amount cannot be negative.");
  });
});
