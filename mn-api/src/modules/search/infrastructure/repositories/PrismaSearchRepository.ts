import { ISearchRepository } from "../../domain/repositories/ISearchRepository";
import { SearchFilters } from "../../domain/entities/search.entity";
import { SearchRepository as DatabaseSearchRepository } from "../../../../infrastructure/database/SearchRepository";
import { prisma } from "../../../../infrastructure/database/prisma.service";

export class PrismaSearchRepository implements ISearchRepository {
  private dbSearchRepository: DatabaseSearchRepository;

  constructor() {
    this.dbSearchRepository = new DatabaseSearchRepository();
  }

  async searchProfiles(filters: SearchFilters, currentUserId: number) {
    return await this.dbSearchRepository.searchProfiles(filters as any, currentUserId);
  }

  async updateSearchPreferences(userId: number, preferences: any) {
    return await this.dbSearchRepository.updateSearchPreferences(userId, preferences);
  }

  async getUserPremiumStatus(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_premium: true },
    });
    return user ? user.is_premium : false;
  }
}
