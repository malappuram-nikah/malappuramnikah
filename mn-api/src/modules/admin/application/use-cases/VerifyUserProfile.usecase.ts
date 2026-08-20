import { IAdminRepository } from "../../domain/repositories/IAdminRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export class VerifyUserProfileUseCase {
  constructor(private adminRepository: IAdminRepository) {}

  async execute(id: number, action: string, adminName = "Super Admin"): Promise<void> {
    if (isNaN(id)) {
      throw new BadRequestError("Invalid user ID");
    }

    const newStatus = action === "approve" ? "active" : "in_active";
    await this.adminRepository.updateUserKycVerification(id, newStatus);

    const store = this.adminRepository.getAdminStoreData();
    if (!store.activity_logs) store.activity_logs = [];
    store.activity_logs.unshift({
      id: Date.now(),
      admin: adminName,
      action: `${action === "approve" ? "Approved" : "Deactivated"} matrimony profile of User (ID: ${id})`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
    });
    this.adminRepository.saveAdminStoreData(store);
  }
}
