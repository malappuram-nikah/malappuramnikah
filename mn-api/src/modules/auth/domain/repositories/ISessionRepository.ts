import { SessionEntity } from "../entities/session.entity";

export interface ISessionRepository {
  createSession(userId: number, refreshToken: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<SessionEntity>;
  findSessionByRefreshToken(refreshToken: string): Promise<SessionEntity | null>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: number): Promise<void>;
  isSessionActive(refreshToken: string): Promise<boolean>;
}
