import { IProfileViewRepository } from "../../domain/repositories/IProfileViewRepository";
import { ProfileViewEntity } from "../../domain/entities/interaction.entity";
import prisma from "../../../../shared/database/prisma";

export class PrismaProfileViewRepository implements IProfileViewRepository {
  async findView(viewerId: number, viewedId: number): Promise<ProfileViewEntity | null> {
    const record = await prisma.profileView.findUnique({
      where: {
        viewer_id_viewed_id: { viewer_id: viewerId, viewed_id: viewedId },
      },
    });
    return record ? (record as unknown as ProfileViewEntity) : null;
  }

  async recordView(viewerId: number, viewedId: number): Promise<ProfileViewEntity> {
    const record = await prisma.profileView.upsert({
      where: {
        viewer_id_viewed_id: { viewer_id: viewerId, viewed_id: viewedId },
      },
      create: { viewer_id: viewerId, viewed_id: viewedId },
      update: { created_at: new Date() },
    });
    return record as unknown as ProfileViewEntity;
  }

  async getViewsGiven(viewerId: number): Promise<ProfileViewEntity[]> {
    const records = await prisma.profileView.findMany({
      where: { viewer_id: viewerId },
      include: {
        viewed: {
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
    return records as unknown as ProfileViewEntity[];
  }

  async getViewsReceived(viewedId: number): Promise<ProfileViewEntity[]> {
    const records = await prisma.profileView.findMany({
      where: { viewed_id: viewedId },
      include: {
        viewer: {
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
    return records as unknown as ProfileViewEntity[];
  }
}
