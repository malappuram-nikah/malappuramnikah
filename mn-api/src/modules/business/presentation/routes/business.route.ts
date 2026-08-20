import { Router } from "express";
import { BusinessController } from "../controllers/business.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

// Categories (Public & Admin)
router.get("/categories", BusinessController.listCategories);
router.post("/categories", authenticateUser, BusinessController.createCategory);

// Public Profile & Leaderboard
router.get("/profile/:id", BusinessController.getPublicProfile);
router.get("/leaderboard/:categoryId", BusinessController.getLeaderboard);
router.get("/offers/:businessId", BusinessController.getActiveOffers);

// Protected Business Profile Management
router.post("/profile", authenticateUser, BusinessController.createProfile);
router.get("/my-profile", authenticateUser, BusinessController.getMyProfile);
router.put("/profile/:id", authenticateUser, BusinessController.updateProfile);

// Protected Media & Portfolio Work
router.post("/media", authenticateUser, BusinessController.addMedia);
router.post("/work", authenticateUser, BusinessController.createWork);
router.delete("/work/:id", authenticateUser, BusinessController.deleteWork);

// Protected Offers Management
router.post("/offers", authenticateUser, BusinessController.createOffer);

// Bookings & Reviews
router.post("/bookings", authenticateUser, BusinessController.createBooking);
router.put("/bookings/:id/status", authenticateUser, BusinessController.updateBookingStatus);
router.post("/reviews", authenticateUser, BusinessController.submitReview);

export default router;
