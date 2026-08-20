import { IAdminRepository } from "../../domain/repositories/IAdminRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export class ToggleUserPremiumUseCase {
  constructor(private adminRepository: IAdminRepository) {}

  async execute(id: number, adminName = "Super Admin"): Promise<boolean> {
    if (isNaN(id)) {
      throw new BadRequestError("Invalid user ID");
    }

    const newPremiumState = await this.adminRepository.toggleUserPremium(id);

    const store = this.adminRepository.getAdminStoreData();
    if (!store.activity_logs) store.activity_logs = [];
    store.activity_logs.unshift({
      id: Date.now(),
      admin: adminName,
      action: `Toggled Premium plan for User ID ${id} to ${newPremiumState ? "ACTIVE" : "INACTIVE"}`,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
    });
    this.adminRepository.saveAdminStoreData(store);

    return newPremiumState;
  }
}
