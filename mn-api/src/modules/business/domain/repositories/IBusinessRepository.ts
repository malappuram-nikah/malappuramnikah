export interface BiodataPermissionResult {
  allowed: boolean;
  status: string;
  isSelf: boolean;
  message?: string;
}

export interface IBusinessRepository {
  toggleBlock(blockerId: number, targetId: number): Promise<string>;
  getBlockedIds(userId: number): Promise<number[]>;
  toggleFavourite(favouriterId: number, targetId: number): Promise<string>;
  getFavouriteAndBlockedIds(userId: number): Promise<{ favourite_ids: number[]; blocked_ids: number[] }>;
  createFeedback(userId: number, category: string, rating: number, subject: string, message: string): Promise<any>;
  checkBiodataAccessPermission(requesterId: number, targetUserId: number): Promise<BiodataPermissionResult>;
  isBiodataDownloadEnabled(): boolean;
  recordBiodataDownload(requesterId: number, targetUserId: number): Promise<void>;
  getUserById(id: number | string): Promise<any>;
}
