import { IStorageService, StorageUploadResult } from "../../shared/storage/IStorageService";
import { MediaStorageService } from "../service/MediaStorageService";

export class MediaStorageAdapter implements IStorageService {
  async uploadFile(fileData: string, folder = "photos"): Promise<StorageUploadResult> {
    const url = await MediaStorageService.uploadMedia(fileData, folder);
    const isCloudinary = MediaStorageService.isCloudinaryConfigured;
    return {
      url,
      fileName: url.split("/").pop() || "file",
      isCloudinary,
    };
  }

  async deleteFile(publicIdOrName: string): Promise<void> {
    // Media delete action (optional Cloudinary / filesystem cleanup)
  }

  getPrivateUrl(fileName: string): string {
    return MediaStorageService.getPrivateMediaUrl(fileName);
  }
}
