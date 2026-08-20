import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BusinessWorkEntity } from "../../domain/entities/business.entity";
import { BusinessValidator } from "../../domain/services/BusinessValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class ManageBusinessWorkUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async createWork(
    userId: number,
    businessId: number,
    title: string,
    description?: string,
    categoryType?: string,
    workDate?: string,
    mediaUrls?: string[]
  ): Promise<BusinessWorkEntity> {
    const profile = await this.businessRepository.findProfileById(businessId);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);

    return await this.businessRepository.createWork({
      business_id: businessId,
      title,
      description,
      category_type: categoryType,
      work_date: workDate,
      media_urls: mediaUrls,
    });
  }

  async updateWork(
    userId: number,
    workId: number,
    data: Partial<BusinessWorkEntity>
  ): Promise<BusinessWorkEntity> {
    const work = await this.businessRepository.findWorkById(workId);
    if (!work) {
      throw new NotFoundError("Business work record not found.");
    }
    const profile = await this.businessRepository.findProfileById(work.business_id);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);

    return await this.businessRepository.updateWork(workId, data);
  }

  async deleteWork(userId: number, workId: number): Promise<void> {
    const work = await this.businessRepository.findWorkById(workId);
    if (!work) {
      throw new NotFoundError("Business work record not found.");
    }
    const profile = await this.businessRepository.findProfileById(work.business_id);
    if (!profile) {
      throw new NotFoundError("Business profile not found.");
    }
    BusinessValidator.validateOwnership(userId, profile);

    await this.businessRepository.deleteWork(workId);
  }
}
