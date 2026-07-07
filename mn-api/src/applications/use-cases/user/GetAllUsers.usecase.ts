import { IUserRepository } from "../../../domain/interfaces/IUserRepository";

export class GetAllUsers {
  constructor(private userRepository: IUserRepository) {}

  async execute(filters?: { gender?: string; status?: string; limit?: number; ids?: number[] }) {
    return this.userRepository.findAll(filters);
  }
}
