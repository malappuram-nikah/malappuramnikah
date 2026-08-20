import { ProfileEntity } from "../entities/profile.entity";

export interface GetProfilesOptions {
  gender?: string;
  limit?: number;
  ids?: number[];
  lightweight?: boolean;
}

export interface PublicStats {
  registeredMembers: number;
  happyMarriages: number;
  verifiedPercentage: number;
  yearsOfTrust: number;
}

export interface IProfileRepository {
  findById(id: number | string): Promise<ProfileEntity | null>;
  findProfiles(options: GetProfilesOptions): Promise<ProfileEntity[]>;
  updateProfile(id: number, details: Record<string, any>, coreFields?: Record<string, any>): Promise<ProfileEntity>;
  deleteUser(id: number): Promise<void>;
  getPublicStats(): Promise<PublicStats>;
}
