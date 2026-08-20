import { ISessionRepository } from "../../domain/repositories/ISessionRepository";

export class LogoutUserUseCase {
  constructor(private sessionRepository: ISessionRepository) {}

  async execute(refreshToken?: string, userId?: number): Promise<void> {
    if (refreshToken) {
      await this.sessionRepository.revokeSession(refreshToken);
    }
    if (userId) {
      await this.sessionRepository.revokeAllUserSessions(userId);
    }
  }
}
