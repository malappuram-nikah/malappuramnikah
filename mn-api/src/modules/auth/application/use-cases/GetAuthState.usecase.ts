import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UnauthorizedError } from "../../../../shared/errors/AppError";

export class GetAuthStateUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: number): Promise<{ isAuthenticated: boolean; user: any }> {
    if (!userId) {
      throw new UnauthorizedError("Unauthorized. Identity unauthenticated.");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User account not found.");
    }

    const { password, ...safeUser } = user as any;

    return {
      isAuthenticated: true,
      user: safeUser,
    };
  }
}
