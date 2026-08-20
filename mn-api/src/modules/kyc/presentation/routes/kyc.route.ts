import { Router } from "express";
import { KycController } from "../controllers/kyc.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.post("/kyc/submit", authenticateUser, KycController.submitKyc);
router.post("/kyc/replace-document", authenticateUser, KycController.replaceDocument);
router.post("/kyc/resubmit", authenticateUser, KycController.resubmitKyc);
router.get("/kyc/status", authenticateUser, KycController.getKycStatus);
router.get("/kyc/document/:fileName", authenticateUser, KycController.getKycDocument);

// Admin Authorized Endpoints
router.post("/kyc/admin/review/:applicationId", authenticateUser, KycController.reviewKyc);
router.post("/kyc/admin/approve/:applicationId", authenticateUser, KycController.approveKyc);
router.post("/kyc/admin/reject/:applicationId", authenticateUser, KycController.rejectKyc);

export default router;
