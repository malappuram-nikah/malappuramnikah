import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.get("/profile", authenticateUser, ProfileController.getMyProfile);
router.get("/profile/:id", authenticateUser, ProfileController.getProfileById);

router.patch("/profile/basic", authenticateUser, ProfileController.updateBasicDetails);
router.patch("/profile/location", authenticateUser, ProfileController.updateLocationDetails);
router.patch("/profile/education", authenticateUser, ProfileController.updateEducationDetails);
router.patch("/profile/occupation", authenticateUser, ProfileController.updateOccupationDetails);
router.patch("/profile/family", authenticateUser, ProfileController.updateFamilyDetails);
router.patch("/profile/preferences", authenticateUser, ProfileController.updatePreferences);
router.patch("/profile/privacy", authenticateUser, ProfileController.updatePrivacySettings);

router.post("/profile/media", authenticateUser, ProfileController.uploadMedia);
router.delete("/profile/media/:mediaId", authenticateUser, ProfileController.deleteMedia);
router.put("/profile/media/:mediaId/primary", authenticateUser, ProfileController.setPrimaryMedia);

export default router;
