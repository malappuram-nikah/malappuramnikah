import { IAdminRepository } from "../../domain/repositories/IAdminRepository";

export class GetAdminStoreUseCase {
  constructor(private adminRepository: IAdminRepository) {}

  execute(): any {
    return this.adminRepository.getAdminStoreData();
  }
}
