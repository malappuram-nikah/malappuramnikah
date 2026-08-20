import authRouter from "./routes/auth.route";
import otpRouter from "./routes/otp.route";

export { authRouter, otpRouter };
export * from "./domain/entities/user.entity";
export * from "./domain/entities/otp.entity";
export * from "./domain/repositories/IUserRepository";
export * from "./domain/repositories/IOtpRepository";
