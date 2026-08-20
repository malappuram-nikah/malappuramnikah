import { AdminEntity } from "../entities/admin.entity";

export interface IAdminRepository {
  findAdminByEmail(email: string): Promise<AdminEntity | null>;
  findAdminByMobile(mobileNumber: string): Promise<AdminEntity | null>;
  findAdminById(id: number): Promise<AdminEntity | null>;
  seedAdmin(data: { name: string; email: string; mobile_number: string; passwordHash: string; role: string }): Promise<AdminEntity>;
  getAdminStats(): Promise<any>;
  getAdminUsers(params: any): Promise<{ users: any[]; total: number }>;
  getAdminUserById(id: number, token?: string): Promise<any>;
  updateUserStatus(id: number, status: string): Promise<any>;
  updateUserKycVerification(id: number, status: string): Promise<any>;
  toggleUserPremium(id: number): Promise<boolean>;
  getAdminStoreData(): any;
  saveAdminStoreData(store: any): void;
}
