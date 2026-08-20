import { IAdminRepository } from "../../domain/repositories/IAdminRepository";

export class GetAdminStatsUseCase {
  constructor(private adminRepository: IAdminRepository) {}

  async execute(): Promise<any> {
    return await this.adminRepository.getAdminStats();
  }
}
