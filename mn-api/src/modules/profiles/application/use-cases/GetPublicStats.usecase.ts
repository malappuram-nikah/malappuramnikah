import { IProfileRepository, PublicStats } from "../../domain/repositories/IProfileRepository";

export class GetPublicStatsUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(): Promise<PublicStats> {
    return await this.profileRepository.getPublicStats();
  }
}
