import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { IFavouriteRepository } from "../../domain/repositories/IFavouriteRepository";
import { IProfileViewRepository } from "../../domain/repositories/IProfileViewRepository";
import { UnifiedInteractionHistory } from "../../domain/entities/interaction.entity";

export class GetInteractionHistoryUseCase {
  constructor(
    private interestRepository: IInterestRepository,
    private blockRepository: IBlockRepository,
    private favouriteRepository: IFavouriteRepository,
    private profileViewRepository: IProfileViewRepository
  ) {}

  async execute(userId: number): Promise<UnifiedInteractionHistory> {
    const [sentInterests, receivedInterests, blockedUsers, favourites, profileViews] = await Promise.all([
      this.interestRepository.getSentInterests(userId),
      this.interestRepository.getReceivedInterests(userId),
      this.blockRepository.getBlockedUsers(userId),
      this.favouriteRepository.getFavourites(userId),
      this.profileViewRepository.getViewsGiven(userId),
    ]);

    return {
      sentInterests,
      receivedInterests,
      blockedUsers,
      favourites,
      profileViews,
    };
  }
}
