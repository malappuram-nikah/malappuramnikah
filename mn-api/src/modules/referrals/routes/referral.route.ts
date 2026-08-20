import { Router } from "express";
import { ReferralController } from "../controllers/referral.controller";
import { ValidateReferralCodeUseCase } from "../application/use-cases/ValidateReferralCode.usecase";
import { GetMyReferralInfoUseCase } from "../application/use-cases/GetMyReferralInfo.usecase";
import { GetReferralHistoryUseCase } from "../application/use-cases/GetReferralHistory.usecase";
import { GetReferralTransactionsUseCase } from "../application/use-cases/GetReferralTransactions.usecase";
import { RedeemReferralPointsUseCase } from "../application/use-cases/RedeemReferralPoints.usecase";
import { GenerateGuestReferralUseCase } from "../application/use-cases/GenerateGuestReferral.usecase";
import { PrismaReferralRepository } from "../infrastructure/repositories/PrismaReferralRepository";
import { memberAccountGuard } from "../../../shared/authorization/memberAccount.guard";

const referralRouter = Router();
referralRouter.use(memberAccountGuard);

const referralRepository = new PrismaReferralRepository();

const validateReferralCodeUseCase = new ValidateReferralCodeUseCase(referralRepository);
const getMyReferralInfoUseCase = new GetMyReferralInfoUseCase(referralRepository);
const getReferralHistoryUseCase = new GetReferralHistoryUseCase(referralRepository);
const getReferralTransactionsUseCase = new GetReferralTransactionsUseCase(referralRepository);
const redeemReferralPointsUseCase = new RedeemReferralPointsUseCase(referralRepository);
const generateGuestReferralUseCase = new GenerateGuestReferralUseCase(referralRepository);

const referralController = new ReferralController(
  validateReferralCodeUseCase,
  getMyReferralInfoUseCase,
  getReferralHistoryUseCase,
  getReferralTransactionsUseCase,
  redeemReferralPointsUseCase,
  generateGuestReferralUseCase
);

referralRouter.post("/validate", (req, res, next) => referralController.validateCode(req, res, next));
referralRouter.get("/me", (req, res, next) => referralController.getMe(req, res, next));
referralRouter.get("/history", (req, res, next) => referralController.getHistory(req, res, next));
referralRouter.get("/transactions", (req, res, next) => referralController.getTransactions(req, res, next));
referralRouter.post("/redeem", (req, res, next) => referralController.redeem(req, res, next));

export default referralRouter;
export { referralController };
