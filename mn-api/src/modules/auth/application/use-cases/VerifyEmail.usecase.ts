import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export interface VerifyEmailDto {
  userId: number;
  email: string;
}

export class VerifyEmailUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: VerifyEmailDto): Promise<{ message: string }> {
    if (!dto.email || !dto.email.includes("@")) {
      throw new BadRequestError("Valid email address is required.");
    }

    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    await this.userRepository.updateEmail(user.id, dto.email);
    return { message: "Email address verified and updated successfully." };
  }
}
