import { IFavouriteRepository } from "../../domain/repositories/IFavouriteRepository";
import { FavouriteEntity } from "../../domain/entities/interaction.entity";
import prisma from "../../../../shared/database/prisma";

export class PrismaFavouriteRepository implements IFavouriteRepository {
  async findFavourite(favouriterId: number, favouritedId: number): Promise<FavouriteEntity | null> {
    const record = await prisma.favourite.findUnique({
      where: {
        favouriter_id_favourited_id: { favouriter_id: favouriterId, favourited_id: favouritedId },
      },
    });
    return record ? (record as unknown as FavouriteEntity) : null;
  }

  async addFavourite(favouriterId: number, favouritedId: number): Promise<FavouriteEntity> {
    const record = await prisma.favourite.create({
      data: { favouriter_id: favouriterId, favourited_id: favouritedId },
    });
    return record as unknown as FavouriteEntity;
  }

  async removeFavourite(favouriterId: number, favouritedId: number): Promise<void> {
    await prisma.favourite.deleteMany({
      where: { favouriter_id: favouriterId, favourited_id: favouritedId },
    });
  }

  async getFavourites(favouriterId: number): Promise<FavouriteEntity[]> {
    const records = await prisma.favourite.findMany({
      where: { favouriter_id: favouriterId },
      include: {
        favourited: {
          select: {
            id: true,
            email: true,
            member_profile: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return records as unknown as FavouriteEntity[];
  }
}
