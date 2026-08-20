import { IFavouriteRepository } from "../../domain/repositories/IFavouriteRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import prisma from "../../../../shared/database/prisma";

export class FavouriteUserUseCase {
  constructor(
    private favouriteRepository: IFavouriteRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(favouriterId: number, favouritedId: number): Promise<{ message: string; isFavourited: boolean }> {
    InteractionValidator.validateSelfInteraction(favouriterId, favouritedId, "favourite");

    const targetUser = await prisma.user.findUnique({
      where: { id: favouritedId },
      select: { id: true, status: true },
    });
    InteractionValidator.validateUserStatus(targetUser);

    const isBlocked = await this.blockRepository.isBlockedEither(favouriterId, favouritedId);
    InteractionValidator.validateNotBlocked(isBlocked);

    const existing = await this.favouriteRepository.findFavourite(favouriterId, favouritedId);
    if (existing) {
      await this.favouriteRepository.removeFavourite(favouriterId, favouritedId);
      return { message: "Removed from favourites.", isFavourited: false };
    }

    await this.favouriteRepository.addFavourite(favouriterId, favouritedId);

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: favouritedId,
        sender_id: favouriterId,
        type: "FAVOURITE_ADDED",
        title: "Added to Shortlist",
        message: "Someone added your profile to their shortlisted profiles.",
      },
    });

    return { message: "Added to favourites successfully.", isFavourited: true };
  }
}
