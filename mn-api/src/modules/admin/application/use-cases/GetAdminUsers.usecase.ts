import { IAdminRepository } from "../../domain/repositories/IAdminRepository";

export class GetAdminUsersUseCase {
  constructor(private adminRepository: IAdminRepository) {}

  async execute(params: any): Promise<{ users: any[]; pagination: any }> {
    const page = Math.max(parseInt(params.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(params.limit || "10", 10), 1), 100);

    const { users, total } = await this.adminRepository.getAdminUsers(params);
    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async executeGetById(id: number, token?: string): Promise<any> {
    return await this.adminRepository.getAdminUserById(id, token);
  }
}
