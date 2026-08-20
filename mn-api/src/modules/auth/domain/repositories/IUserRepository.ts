import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  createUser(userData: Partial<UserEntity>): Promise<UserEntity>;
  findByMobile(mobileNumber: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number | string): Promise<UserEntity | null>;
  updateUser(id: number, data: Partial<UserEntity>): Promise<UserEntity>;
  updateStatus(id: number, status: string): Promise<UserEntity>;
}
