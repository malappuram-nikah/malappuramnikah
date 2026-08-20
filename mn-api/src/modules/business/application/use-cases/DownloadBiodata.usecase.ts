import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { NotFoundError, ForbiddenError } from "../../../../shared/errors/AppError";

export class DownloadBiodataUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(requesterId: number, targetIdParam: string): Promise<any> {
    const targetUser = await this.businessRepository.getUserById(targetIdParam);
    if (!targetUser || !targetUser.id) {
      throw new NotFoundError("Profile not found.");
    }

    if (!this.businessRepository.isBiodataDownloadEnabled()) {
      const err = new ForbiddenError("Biodata downloads are currently disabled by the administrator.");
      (err as any).code = "BIODATA_DISABLED";
      throw err;
    }

    const perm = await this.businessRepository.checkBiodataAccessPermission(requesterId, targetUser.id);
    if (!perm.allowed) {
      const err = new ForbiddenError("Access denied. Biodata is available after the profile owner accepts your invite.");
      (err as any).code = "BIODATA_ACCESS_DENIED";
      (err as any).status = perm.status;
      throw err;
    }

    await this.businessRepository.recordBiodataDownload(requesterId, targetUser.id);

    const { password, ...safeUser } = targetUser as any;
    return {
      success: true,
      message: "Biodata download authorized.",
      isAccepted: true,
      user: safeUser,
    };
  }
}
