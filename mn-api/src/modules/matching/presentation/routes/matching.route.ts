import { Router } from "express";
import { MatchingController } from "../controllers/matching.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.get("/recommendations", authenticateUser, MatchingController.getRecommendations);
router.get("/score/:targetUserId", authenticateUser, MatchingController.calculateMatchScore);

export default router;
