import prisma from "../../../infrastructure/prisma/prisamClient";
import bcrypt from "bcryptjs";
import { GeminiExtractionService } from "../../../infrastructure/service/GeminiExtractionService";
import { MediaStorageService } from "../../../infrastructure/service/MediaStorageService";

export class InstantRegistrationUseCase {
  private geminiService: GeminiExtractionService;

  constructor() {
    this.geminiService = new GeminiExtractionService();
  }

  private calculateAge(dobString: string): number {
    if (!dobString) return 25;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) ? 25 : age;
  }

  private generateTemporaryPassword(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async execute(base64File: string, mimeType: string): Promise<any> {
    if (!base64File) {
      throw new Error("No identity document file provided.");
    }

    // 1. Extract metadata from document via Gemini 1.5 Flash
    const extracted = await this.geminiService.extractIdData(base64File, mimeType);
    const fullName = (extracted.fullName || "").trim();
    let mobile = (extracted.mobileNumber || "").replace(/\D/g, ""); // strip non-digits

    if (!fullName) {
      throw new Error("Could not extract a valid full name from the document.");
    }

    // Default mobile number if not extracted
    if (!mobile || mobile.length < 8) {
      throw new Error("Could not extract a valid mobile number from the document.");
    }

    // Standardize to Indian mobile number structure if 10-digits
    if (mobile.length === 10) {
      mobile = `+91${mobile}`;
    } else if (!mobile.startsWith("+")) {
      mobile = `+${mobile}`;
    }

    // 2. Check if mobile number already exists in DB
    const existing = await prisma.user.findUnique({
      where: { mobile_number: mobile }
    });

    if (existing) {
      throw new Error(`A member with mobile number ${mobile} is already registered.`);
    }

    // 3. Upload ID document to media storage
    const documentUrl = await MediaStorageService.uploadMedia(base64File, "kyc");

    // 4. Generate random temporary password
    const rawPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 5. Structure fields for DB
    const dob = extracted.dateOfBirth || "1995-01-01";
    const age = this.calculateAge(dob);
    
    let gender = (extracted.gender || "Male").trim();
    gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    if (gender !== "Male" && gender !== "Female") {
      gender = "Male";
    }

    const location = (extracted.address || "Malappuram").trim();
    const caste = (extracted.caste || "Other").trim();

    // 6. Build the profile details draft objects
    const profileDetails = {
      mn_basic_details_draft: {
        fullName,
        dob,
        age,
        gender,
        location,
        maritalStatus: "Never Married",
        profileCreatedBy: "Admin Support (Instant Campaign)"
      },
      mn_religious_info_draft: {
        religion: "Muslim",
        caste
      },
      mn_profile_photos_draft: {
        photos: []
      }
    };

    // 7. Create User inside database
    const newUser = await prisma.user.create({
      data: {
        first_name: fullName,
        last_name: "",
        mobile_number: mobile,
        password: hashedPassword,
        dob,
        gender,
        location,
        cast: caste,
        profile_for: "Myself",
        status: "active", // Mark active immediately
        kyc_status: "VERIFIED", // Mark KYC Verified instantly since verified by Admin physically
        kyc_front_url: documentUrl,
        profile_details: profileDetails as any
      }
    });

    // 8. Return computed response
    const profileId = `MN-${100000 + newUser.id}`;

    return {
      userId: newUser.id,
      profileId,
      fullName,
      mobile,
      rawPassword,
      gender,
      location,
      caste,
      documentUrl,
      dateOfBirth: dob
    };
  }
}
export default InstantRegistrationUseCase;
