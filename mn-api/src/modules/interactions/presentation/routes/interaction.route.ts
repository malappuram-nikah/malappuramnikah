import { Router } from "express";
import { InteractionController } from "../controllers/interaction.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

// Interests
router.post("/interests/send", authenticateUser, InteractionController.sendInterest);
router.post("/interests/accept/:interestId", authenticateUser, InteractionController.acceptInterest);
router.post("/interests/reject/:interestId", authenticateUser, InteractionController.rejectInterest);
router.delete("/interests/withdraw/:interestId", authenticateUser, InteractionController.withdrawInterest);

// Blocks
router.post("/blocks/block", authenticateUser, InteractionController.blockUser);
router.post("/blocks/unblock/:targetUserId", authenticateUser, InteractionController.unblockUser);
router.delete("/blocks/unblock/:targetUserId", authenticateUser, InteractionController.unblockUser);

// Favourites
router.post("/favourites/toggle", authenticateUser, InteractionController.toggleFavourite);
router.delete("/favourites/remove/:targetUserId", authenticateUser, InteractionController.removeFavourite);

// Profile Views
router.post("/views/record", authenticateUser, InteractionController.recordProfileView);

// Interaction History
router.get("/interactions/history", authenticateUser, InteractionController.getInteractionHistory);

export default router;
