import { IFavouriteRepository } from "../../domain/repositories/IFavouriteRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class RemoveFavouriteUseCase {
  constructor(private favouriteRepository: IFavouriteRepository) {}

  async execute(favouriterId: number, favouritedId: number): Promise<{ message: string }> {
    InteractionValidator.validateSelfInteraction(favouriterId, favouritedId, "remove favourite for");

    const existing = await this.favouriteRepository.findFavourite(favouriterId, favouritedId);
    if (!existing) {
      throw new NotFoundError("Favourite record not found.");
    }

    await this.favouriteRepository.removeFavourite(favouriterId, favouritedId);

    return { message: "Removed from favourites." };
  }
}
