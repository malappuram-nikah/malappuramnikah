import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";

export class GetFavouritesListUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(userId: number): Promise<{ favourite_ids: number[]; blocked_ids: number[] }> {
    return await this.businessRepository.getFavouriteAndBlockedIds(userId);
  }
}
