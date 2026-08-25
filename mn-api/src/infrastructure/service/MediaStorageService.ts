import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configure Cloudinary only if credentials exist
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET_KEY;

const hasCloudinary = 
  !!cloudName && 
  !!apiKey && 
  !!apiSecret;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log("Cloudinary Media Storage Service initialized successfully with cloud name:", cloudName);
} else {
  console.log("Cloudinary credentials not found in env. Initialized Local Filesystem Storage Fallback.");
}

export class MediaStorageService {
  /**
   * Uploads base64 media (image/audio/video) to Cloudinary or falls back to local server storage
   * @param base64Data The full base64 Data URI (e.g. data:image/png;base64,...)
   * @param folderName Target subdirectory (e.g. 'photos', 'videos', 'voice')
   * @returns The public HTTPS or local absolute URL of the uploaded file
   */
  static async uploadMedia(base64Data: string, folderName: string): Promise<string> {
    if (!base64Data) {
      throw new Error("No media data provided for upload");
    }

    // If it's already an HTTP/HTTPS URL, don't re-upload
    if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
      return base64Data;
    }

    // 1. CLOUDINARY UPLOAD ROUTE
    if (hasCloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(base64Data, {
          folder: `malappuram_nikah/${folderName}`,
          resource_type: "auto", // Auto-detect video/audio/image
        });
        return uploadResult.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed, falling back to local storage:", err);
      }
    }

    // 2. LOCAL FILESYSTEM UPLOAD ROUTE (Fallback)
    try {
      // Parse Data URI scheme: "data:mime/type;base64,xxxx"
      const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = "application/octet-stream";
      let base64Body = base64Data;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Body = matches[2];
      } else {
        // Strip prefix manually if present
        if (base64Data.includes(";base64,")) {
          base64Body = base64Data.split(";base64,")[1];
        }
      }

      // Map common mime types to file extensions
      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/quicktime": "mov",
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
      };
      
      const extension = extMap[mimeType] || mimeType.split("/")[1] || "bin";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
      
      // Determine public uploads directory path
      const publicUploadsDir = path.join(process.cwd(), "public", "uploads", folderName);
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }

      const filePath = path.join(publicUploadsDir, fileName);
      const buffer = Buffer.from(base64Body, "base64");
      fs.writeFileSync(filePath, buffer);

      // Construct server URL
      const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3333}`;
      return `${appUrl}/uploads/${folderName}/${fileName}`;
    } catch (err: any) {
      console.error("Local file upload failed:", err);
      throw new Error(`Media storage failed: ${err.message}`);
    }
  }

  static get isCloudinaryConfigured(): boolean {
    return hasCloudinary;
  }

  static async uploadPrivateMedia(base64Data: string, fileName: string): Promise<string> {
    if (!base64Data) {
      throw new Error("No media data provided for upload");
    }

    if (hasCloudinary) {
      try {
        const publicId = path.parse(fileName).name;
        await cloudinary.uploader.upload(base64Data, {
          folder: "malappuram_nikah/kyc",
          public_id: publicId,
          resource_type: "auto",
          type: "authenticated",
          access_mode: "authenticated"
        });
        return fileName;
      } catch (err) {
        console.error("Cloudinary private upload failed, falling back to local storage:", err);
      }
    }

    try {
      const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let base64Body = base64Data;

      if (matches && matches.length === 3) {
        base64Body = matches[2];
      } else {
        if (base64Data.includes(";base64,")) {
          base64Body = base64Data.split(";base64,")[1];
        }
      }

      const publicUploadsDir = path.join(process.cwd(), "public", "uploads", "kyc");
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }

      const filePath = path.join(publicUploadsDir, fileName);
      const buffer = Buffer.from(base64Body, "base64");
      fs.writeFileSync(filePath, buffer);

      return fileName;
    } catch (err: any) {
      console.error("Local private file upload failed:", err);
      throw new Error(`Private media storage failed: ${err.message}`);
    }
  }

  static getPrivateMediaUrl(fileName: string): string {
    if (hasCloudinary) {
      let baseName = path.parse(fileName).name;
      if (baseName.startsWith("http")) {
        try {
          baseName = path.parse(new URL(fileName).pathname).name;
        } catch {}
      }
      const publicId = `malappuram_nikah/kyc/${baseName}`;
      const ext = path.extname(fileName).replace(".", "") || "jpg";
      return cloudinary.url(`${publicId}.${ext}`, {
        type: "authenticated",
        sign_url: true,
        secure: true,
        resource_type: "image",
        expires_at: Math.floor(Date.now() / 1000) + 7200, // 2 hours
      });
    }
    return path.join(process.cwd(), "public", "uploads", "kyc", fileName);
  }
}
