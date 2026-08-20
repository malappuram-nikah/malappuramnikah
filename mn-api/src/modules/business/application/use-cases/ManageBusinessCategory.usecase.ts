import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessCategoryEntity } from "../../domain/entities/business.entity";

export class ManageBusinessCategoryUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async listCategories(): Promise<BusinessCategoryEntity[]> {
    return await this.businessRepository.getCategories();
  }

  async createCategory(name: string, description?: string): Promise<BusinessCategoryEntity> {
    return await this.businessRepository.createCategory(name, description);
  }
}
