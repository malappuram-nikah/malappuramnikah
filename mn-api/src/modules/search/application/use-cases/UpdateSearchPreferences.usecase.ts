import { ISearchRepository } from "../../domain/repositories/ISearchRepository";

export class UpdateSearchPreferencesUseCase {
  constructor(private searchRepository: ISearchRepository) {}

  async execute(userId: number, preferences: any): Promise<any> {
    return await this.searchRepository.updateSearchPreferences(userId, preferences);
  }
}
