import { IInterestRepository, GetInterestsOptions } from "../../domain/repositories/IInterestRepository";

export class GetUserInterestsUseCase {
  constructor(private interestRepository: IInterestRepository) {}

  async execute(userId: number, options: GetInterestsOptions): Promise<any> {
    return await this.interestRepository.getUserInterests(userId, options);
  }
}
