import { BlockEntity } from "../entities/interaction.entity";

export interface IBlockRepository {
  findBlock(blockerId: number, blockedId: number): Promise<BlockEntity | null>;
  isBlockedEither(userAId: number, userBId: number): Promise<boolean>;
  blockUser(blockerId: number, blockedId: number): Promise<BlockEntity>;
  unblockUser(blockerId: number, blockedId: number): Promise<void>;
  getBlockedUsers(blockerId: number): Promise<BlockEntity[]>;
}
