import authRoutes from "./presentation/routes/auth.route";
import otpRoutes from "./presentation/routes/otp.route";

export { authRoutes, otpRoutes, authRoutes as authRouter, otpRoutes as otpRouter };
export * from "./presentation/controllers/auth.controller";
export * from "./presentation/controllers/otp.controller";
