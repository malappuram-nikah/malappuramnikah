import { Router } from "express";
import { ReferralController } from "../controllers/referral.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.get("/my-code", authenticateUser, ReferralController.getMyCode);
router.get("/validate", ReferralController.validateCode);
router.post("/apply", authenticateUser, ReferralController.applyCode);
router.post("/reward", authenticateUser, ReferralController.rewardReferral);
router.post("/redeem", authenticateUser, ReferralController.redeemPoints);
router.post("/deduct", authenticateUser, ReferralController.deductPoints);
router.post("/expire", authenticateUser, ReferralController.expirePoints);
router.get("/history", authenticateUser, ReferralController.getHistory);

export default router;
