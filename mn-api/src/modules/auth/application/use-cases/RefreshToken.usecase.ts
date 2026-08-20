import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { verifyToken, generateToken } from "../../../../shared/auth/jwt.util";
import { UnauthorizedError } from "../../../../shared/errors/AppError";

export class RefreshTokenUseCase {
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository
  ) {}

  async execute(refreshTokenInput?: string, userAgent?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshTokenInput) {
      throw new UnauthorizedError("Refresh token is required.");
    }

    const payload = verifyToken(refreshTokenInput);
    if (!payload || !payload.userId) {
      throw new UnauthorizedError("Invalid or expired refresh token.");
    }

    const isSessionActive = await this.sessionRepository.isSessionActive(refreshTokenInput);
    if (!isSessionActive) {
      throw new UnauthorizedError("Refresh token session has been revoked or expired.");
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || user.status === "suspended") {
      await this.sessionRepository.revokeSession(refreshTokenInput);
      throw new UnauthorizedError("User account disabled or suspended.");
    }

    // Refresh token rotation: revoke old session, issue new tokens and session
    await this.sessionRepository.revokeSession(refreshTokenInput);

    const newAccessToken = generateToken({
      userId: user.id,
      mobile_number: user.mobile_number,
      email: user.email,
      isAdmin: false,
    });

    const newRefreshToken = generateToken(
      { userId: user.id, type: "refresh", jti: crypto.randomUUID() },
      "7d"
    );

    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionRepository.createSession(
      user.id,
      newRefreshToken,
      newExpiresAt,
      userAgent,
      ipAddress
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
