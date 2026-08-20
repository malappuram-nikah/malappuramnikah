import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export interface ChangePasswordDto {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository
  ) {}

  async execute(dto: ChangePasswordDto): Promise<{ message: string }> {
    if (!dto.oldPassword || !dto.newPassword) {
      throw new BadRequestError("Current password and new password are required.");
    }

    if (dto.newPassword.length < 6) {
      throw new BadRequestError("New password must be at least 6 characters long.");
    }

    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const currentHash = user.password || "";
    const isMatch = await bcrypt.compare(dto.oldPassword, currentHash);
    if (!isMatch) {
      throw new BadRequestError("Current password is incorrect.");
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.updatePassword(user.id, hashedNewPassword);

    // Invalidate all active refresh token sessions on password change
    await this.sessionRepository.revokeAllUserSessions(user.id);

    return { message: "Password changed successfully. Please log in again." };
  }
}
