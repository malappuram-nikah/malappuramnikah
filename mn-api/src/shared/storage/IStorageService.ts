export interface StorageUploadResult {
  url: string;
  publicId?: string;
  fileName: string;
  isCloudinary: boolean;
}

export interface IStorageService {
  uploadFile(fileData: string, folder?: string): Promise<StorageUploadResult>;
  deleteFile(publicIdOrName: string): Promise<void>;
  getPrivateUrl(fileName: string): string;
}
