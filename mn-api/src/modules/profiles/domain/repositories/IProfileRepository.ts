import { ProfileSectionsData } from "../services/ProfileCompletionCalculator";
import { ProfileEntity } from "../entities/profile.entity";

export interface GetProfilesOptions {
  gender?: string;
  ids?: number[];
  limit?: number;
  lightweight?: boolean;
}

export interface PublicStats {
  registeredMembers: number;
  happyMarriages: number;
  verifiedPercentage: number;
  yearsOfTrust: number;
}

export interface FullProfileResult extends ProfileSectionsData {
  userId: number;
  userUuid?: string | null;
  mobileNumber?: string;
  email?: string | null;
  status?: string;
  isPremium?: boolean;
  isNewUser?: boolean;
  kycStatus?: string;
  completionScore: number;
  completionBreakdown: Record<string, number>;
  privacy?: any;
}

export interface IProfileRepository {
  getFullProfile(userId: number): Promise<FullProfileResult | null>;
  findById(id: number | string): Promise<ProfileEntity | null>;
  findProfiles(options: GetProfilesOptions): Promise<ProfileEntity[]>;
  updateProfile(id: number, details: Record<string, any>, coreFields?: Record<string, any>): Promise<ProfileEntity>;
  deleteUser(id: number): Promise<void>;
  getPublicStats(): Promise<PublicStats>;

  updateBasicDetails(userId: number, data: any): Promise<void>;
  updateLocationDetails(userId: number, data: any): Promise<void>;
  updateEducationDetails(userId: number, data: any): Promise<void>;
  updateOccupationDetails(userId: number, data: any): Promise<void>;
  updateFamilyDetails(userId: number, data: any): Promise<void>;
  updatePreferences(userId: number, data: any): Promise<void>;
  updatePrivacySettings(userId: number, data: any): Promise<void>;
  addProfileMedia(userId: number, mediaData: { url: string; media_type?: string; is_primary?: boolean }): Promise<any>;
  deleteProfileMedia(userId: number, mediaId: number): Promise<boolean>;
  setPrimaryMedia(userId: number, mediaId: number): Promise<boolean>;
}
