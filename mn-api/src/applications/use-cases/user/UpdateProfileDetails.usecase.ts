import { IUserRepository } from "../../../domain/interfaces/IUserRepository";

export class UpdateProfileDetailsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: number, profileDetails: any, coreFields?: any) {
    if (!id) {
      throw new Error("User ID is required");
    }
    
    const user = await this.userRepository.updateProfileDetails(id, profileDetails, coreFields);
    return user;
  }
}
