import { InterestEntity, InterestStatus } from "../entities/interaction.entity";

export interface IInterestRepository {
  findInterest(senderId: number, receiverId: number): Promise<InterestEntity | null>;
  findInterestById(id: number): Promise<InterestEntity | null>;
  createInterest(senderId: number, receiverId: number): Promise<InterestEntity>;
  updateInterestStatus(id: number, status: InterestStatus): Promise<InterestEntity>;
  deleteInterest(id: number): Promise<void>;
  getSentInterests(userId: number): Promise<InterestEntity[]>;
  getReceivedInterests(userId: number): Promise<InterestEntity[]>;
}
