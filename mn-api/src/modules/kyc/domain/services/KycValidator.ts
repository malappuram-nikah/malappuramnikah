import { BadRequestError, ForbiddenError, ConflictError } from "../../../../shared/errors/AppError";

export const ALLOWED_DOC_TYPES = ["AADHAAR", "PASSPORT", "VOTER_ID", "DRIVING_LICENSE", "PAN"];
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class KycValidator {
  static validateDocType(docType: string): string {
    if (!docType) {
      throw new BadRequestError("Invalid document type. Allowed: AADHAAR, PASSPORT, VOTER_ID, DRIVING_LICENSE, PAN");
    }
    const upper = docType.toUpperCase();
    if (!ALLOWED_DOC_TYPES.includes(upper)) {
      throw new BadRequestError("Invalid document type. Allowed: AADHAAR, PASSPORT, VOTER_ID, DRIVING_LICENSE, PAN");
    }
    return upper;
  }

  static validateBase64File(base64Data: string, fieldName: string = "Document"): void {
    if (!base64Data) {
      throw new BadRequestError(`${fieldName} file content is required.`);
    }

    // Check MIME type prefix if present (e.g. data:image/png;base64,...)
    if (base64Data.startsWith("data:")) {
      const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1].toLowerCase();
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          throw new BadRequestError(`Invalid file type '${mimeType}' for ${fieldName}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
        }
      }
    }

    // Estimate decoded size in bytes
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, "");
    const estimatedSizeBytes = Math.ceil((base64Content.length * 3) / 4);

    if (estimatedSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError(`${fieldName} exceeds maximum allowed size of 5MB.`);
    }
  }

  static validateOwnership(applicationUserId: number, requestingUserId: number): void {
    if (applicationUserId !== requestingUserId) {
      throw new ForbiddenError("You do not have permission to access or modify this KYC application.");
    }
  }

  static validateStateTransition(currentStatus: string, action: "SUBMIT" | "REPLACE" | "RESUBMIT" | "REVIEW" | "APPROVE" | "REJECT"): void {
    switch (action) {
      case "SUBMIT":
        if (currentStatus === "VERIFIED" || currentStatus === "UNDER_REVIEW") {
          throw new ConflictError(`Cannot submit KYC. Current status is ${currentStatus}`);
        }
        break;

      case "REPLACE":
      case "RESUBMIT":
        if (currentStatus === "VERIFIED") {
          throw new ConflictError("Cannot replace documents for an already VERIFIED KYC application.");
        }
        if (currentStatus === "UNDER_REVIEW") {
          throw new ConflictError("Cannot replace documents while application is UNDER_REVIEW by an admin.");
        }
        break;

      case "REVIEW":
        if (currentStatus === "VERIFIED") {
          throw new ConflictError("Cannot mark already verified KYC as under review.");
        }
        if (currentStatus !== "SUBMITTED" && currentStatus !== "RESUBMITTED") {
          throw new BadRequestError(`Cannot review KYC application with status '${currentStatus}'. Must be SUBMITTED or RESUBMITTED.`);
        }
        break;

      case "APPROVE":
      case "REJECT":
        if (currentStatus !== "SUBMITTED" && currentStatus !== "RESUBMITTED" && currentStatus !== "UNDER_REVIEW") {
          throw new BadRequestError(`Cannot ${action.toLowerCase()} KYC application with status '${currentStatus}'.`);
        }
        break;

      default:
        break;
    }
  }
}
