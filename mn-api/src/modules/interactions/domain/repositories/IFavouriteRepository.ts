import { FavouriteEntity } from "../entities/interaction.entity";

export interface IFavouriteRepository {
  findFavourite(favouriterId: number, favouritedId: number): Promise<FavouriteEntity | null>;
  addFavourite(favouriterId: number, favouritedId: number): Promise<FavouriteEntity>;
  removeFavourite(favouriterId: number, favouritedId: number): Promise<void>;
  getFavourites(favouriterId: number): Promise<FavouriteEntity[]>;
}
