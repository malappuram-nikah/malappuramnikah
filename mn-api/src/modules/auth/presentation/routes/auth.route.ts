import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateUser } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/change-password", authenticateUser, AuthController.changePassword);
router.post("/verify-email", authenticateUser, AuthController.verifyEmail);
router.post("/refresh-token", AuthController.refreshToken);
router.get("/me", authenticateUser, AuthController.getAuthState);

export default router;
