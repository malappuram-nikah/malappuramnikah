import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";

export class GetBlockedListUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(userId: number): Promise<number[]> {
    return await this.businessRepository.getBlockedIds(userId);
  }
}
