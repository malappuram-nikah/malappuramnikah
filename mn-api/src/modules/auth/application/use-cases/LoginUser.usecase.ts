import bcrypt from "bcryptjs";
import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { LoginUserDto } from "../dto/login.dto";
import { rateLimiterService } from "../../infrastructure/security/rateLimiter.service";
import { generateToken } from "../../../../shared/auth/jwt.util";
import { UnauthorizedError, ForbiddenError } from "../../../../shared/errors/AppError";

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository
  ) {}

  async execute(dto: LoginUserDto): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    const identifier = dto.identifier || dto.mobile_number || dto.email;
    if (!identifier || !dto.password) {
      throw new UnauthorizedError("Mobile number/email and password are required.");
    }

    const rateKey = `login:${identifier}`;
    rateLimiterService.checkLoginRateLimit(rateKey);

    let user = await this.userRepository.findByMobileNumber(identifier);
    if (!user && identifier.includes("@")) {
      user = await this.userRepository.findByEmail(identifier);
    }

    if (!user || !user.password) {
      rateLimiterService.recordFailedLogin(rateKey);
      throw new UnauthorizedError("Invalid mobile number/email or password.");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      rateLimiterService.recordFailedLogin(rateKey);
      throw new UnauthorizedError("Invalid mobile number/email or password.");
    }

    if (user.status === "suspended") {
      throw new ForbiddenError("Your account has been suspended. Please contact support.");
    }

    rateLimiterService.resetLoginRateLimit(rateKey);
    await this.userRepository.updateLastLogin(user.id);

    const accessToken = generateToken({
      userId: user.id,
      mobile_number: user.mobile_number,
      email: user.email,
      isAdmin: false,
    });

    const refreshToken = generateToken(
      { userId: user.id, type: "refresh", jti: crypto.randomUUID() },
      "7d"
    );

    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionRepository.createSession(
      user.id,
      refreshToken,
      refreshTokenExpiresAt,
      dto.userAgent,
      dto.ipAddress
    );

    const { password, ...safeUser } = user as any;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }
}
