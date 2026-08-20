import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  findByMobileNumber(mobileNumber: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  createUser(userData: Partial<UserEntity>, referralCodeInput?: string): Promise<UserEntity>;
  updateUser(id: number, data: Partial<UserEntity>): Promise<UserEntity>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
  updateStatus(id: number, status: string): Promise<void>;
  updateLastLogin(id: number): Promise<void>;
}
