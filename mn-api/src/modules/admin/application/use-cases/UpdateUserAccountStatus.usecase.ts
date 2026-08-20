import { IAdminRepository } from "../../domain/repositories/IAdminRepository";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class UpdateUserAccountStatusUseCase {
  constructor(private adminRepository: IAdminRepository) {}

  async execute(id: number, action: string): Promise<any> {
    if (isNaN(id)) {
      throw new BadRequestError("Invalid user ID");
    }

    const statusMap: Record<string, string> = {
      activate: "active",
      deactivate: "in_active",
      suspend: "suspended",
      restore: "active",
    };

    if (!action || !statusMap[action]) {
      throw new BadRequestError("Invalid action. Use activate, deactivate, suspend, or restore.");
    }

    const updatedUser = await this.adminRepository.updateUserStatus(id, statusMap[action]);
    return updatedUser;
  }
}
