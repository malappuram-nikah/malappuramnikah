import { InterestEntity } from "../entities/interest.entity";

export interface GetInterestsOptions {
  type?: "sent" | "received" | "mutual" | "viewed_me" | "visited" | string;
  idsOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface IInterestRepository {
  findInterest(senderId: number, receiverId: number): Promise<InterestEntity | null>;
  createInterest(senderId: number, receiverId: number): Promise<InterestEntity>;
  updateInterestStatus(id: number, status: string): Promise<InterestEntity>;
  deleteInterest(id: number): Promise<void>;
  getUserForInterestCheck(userId: number): Promise<{ id: number; kyc_status: string; gender: string; first_name: string; last_name: string; location: string; profile_details: any } | null>;
  getUserInterests(userId: number, options: GetInterestsOptions): Promise<any>;
}
