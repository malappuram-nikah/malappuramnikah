import { IBusinessRepository, BiodataPermissionResult } from "../../domain/repositories/IBusinessRepository";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class CheckBiodataPermissionUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(requesterId: number, targetIdParam: string): Promise<BiodataPermissionResult> {
    const targetUser = await this.businessRepository.getUserById(targetIdParam);
    if (!targetUser || !targetUser.id) {
      throw new NotFoundError("Profile not found.");
    }

    return await this.businessRepository.checkBiodataAccessPermission(requesterId, targetUser.id);
  }
}
