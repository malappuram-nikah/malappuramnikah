import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { SessionEntity } from "../../domain/entities/session.entity";
import crypto from "crypto";

const activeSessionsStore: Map<string, SessionEntity> = new Map();

export class PrismaSessionRepository implements ISessionRepository {
  async createSession(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string
  ): Promise<SessionEntity> {
    const session: SessionEntity = {
      id: crypto.randomUUID(),
      user_id: userId,
      refresh_token: refreshToken,
      user_agent: userAgent,
      ip_address: ipAddress,
      is_revoked: false,
      expires_at: expiresAt,
      created_at: new Date(),
    };

    activeSessionsStore.set(refreshToken, session);
    return session;
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<SessionEntity | null> {
    const session = activeSessionsStore.get(refreshToken);
    if (!session) return null;
    if (session.is_revoked || session.expires_at < new Date()) {
      activeSessionsStore.delete(refreshToken);
      return null;
    }
    return session;
  }

  async revokeSession(sessionId: string): Promise<void> {
    activeSessionsStore.delete(sessionId);
    for (const [token, session] of activeSessionsStore.entries()) {
      if (session.id === sessionId || session.refresh_token === sessionId || token === sessionId) {
        session.is_revoked = true;
        activeSessionsStore.delete(token);
      }
    }
  }

  async revokeAllUserSessions(userId: number): Promise<void> {
    for (const [token, session] of activeSessionsStore.entries()) {
      if (session.user_id === userId) {
        session.is_revoked = true;
        activeSessionsStore.delete(token);
      }
    }
  }

  async isSessionActive(refreshToken: string): Promise<boolean> {
    const session = await this.findSessionByRefreshToken(refreshToken);
    return !!session && !session.is_revoked;
  }
}
