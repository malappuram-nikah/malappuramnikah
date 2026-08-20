import { MonetizationModel } from "../entities/business.entity";

export interface CommissionResult {
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  businessAmount: number;
}

export class CommissionCalculator {
  static calculate(
    grossAmount: number,
    monetizationModel: MonetizationModel,
    commissionRate: number = 5.0
  ): CommissionResult {
    if (grossAmount < 0) {
      throw new Error("Gross amount cannot be negative.");
    }

    if (monetizationModel === "ONE_TIME") {
      return {
        grossAmount,
        commissionRate: 0,
        commissionAmount: 0,
        businessAmount: grossAmount,
      };
    }

    const rate = Math.max(0, commissionRate);
    const commissionAmount = Number(((grossAmount * rate) / 100).toFixed(2));
    const businessAmount = Number((grossAmount - commissionAmount).toFixed(2));

    return {
      grossAmount,
      commissionRate: rate,
      commissionAmount,
      businessAmount,
    };
  }
}
