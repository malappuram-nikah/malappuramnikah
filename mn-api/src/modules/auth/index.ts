import authRouter from "./routes/auth.route";
import otpRouter from "./routes/otp.route";

export { authRouter, otpRouter };
export * from "./domain/entities/user.entity";
export * from "./domain/entities/otp.entity";
export * from "./domain/entities/session.entity";
export * from "./domain/repositories/IUserRepository";
export * from "./domain/repositories/IOtpRepository";
export * from "./domain/repositories/ISessionRepository";
export * from "./domain/types/auth.types";
