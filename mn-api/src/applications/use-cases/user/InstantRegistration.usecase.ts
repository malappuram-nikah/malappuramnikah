import prisma from "../../../infrastructure/prisma/prisamClient";
import bcrypt from "bcryptjs";
import { MediaStorageService } from "../../../infrastructure/service/MediaStorageService";

export interface InstantRegistrationData {
  base64File: string;
  fullName: string;
  dob?: string;
  gender?: string;
  mobileNumber: string;
  maritalStatus?: string;
  height?: string;
  location?: string;
  highestEducation?: string;
  professionType?: string;
  workplace?: string;
  religion?: string;
  caste?: string;
  religiousness?: string;
  familyType?: string;
  financialStatus?: string;
  familyValues?: string;
  eatingHabits?: string;
  smokingHabits?: string;
  drinkingHabits?: string;
  interestedActivities?: string;
  personalDescription?: string;
}

export class InstantRegistrationUseCase {
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

  async execute(params: InstantRegistrationData): Promise<any> {
    const {
      base64File,
      fullName,
      dob = "",
      gender = "Male",
      mobileNumber,
      maritalStatus = "Never Married",
      height = "",
      location = "",
      highestEducation = "",
      professionType = "",
      workplace = "",
      religion = "Muslim",
      caste = "Sunni",
      religiousness = "Religious",
      familyType = "Nuclear",
      financialStatus = "Middle-class",
      familyValues = "Orthodox / Traditional",
      eatingHabits = "Any",
      smokingHabits = "No",
      drinkingHabits = "No",
      interestedActivities = "",
      personalDescription = ""
    } = params;

    if (!base64File) {
      throw new Error("No identity document file provided.");
    }
    if (!fullName || !mobileNumber) {
      throw new Error("Full name and Mobile number are required for registration.");
    }

    let mobile = mobileNumber.replace(/\D/g, ""); // strip non-digits

    // Standardize to Indian mobile number structure if 10-digits
    if (mobile.length === 10) {
      mobile = `+91${mobile}`;
    } else if (!mobile.startsWith("+")) {
      mobile = `+${mobile}`;
    }

    // 1. Check if mobile number already exists in DB
    const existing = await prisma.user.findUnique({
      where: { mobile_number: mobile }
    });

    if (existing) {
      throw new Error(`A member with mobile number ${mobile} is already registered.`);
    }

    // 2. Upload ID document to media storage
    const documentUrl = await MediaStorageService.uploadMedia(base64File, "kyc");

    // 3. Generate random temporary password
    const rawPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 4. Structure fields for DB
    const age = this.calculateAge(dob);
    
    let sanitizedGender = (gender || "Male").trim();
    sanitizedGender = sanitizedGender.charAt(0).toUpperCase() + sanitizedGender.slice(1).toLowerCase();
    if (sanitizedGender !== "Male" && sanitizedGender !== "Female") {
      sanitizedGender = "Male";
    }

    // Parse activities into array if comma-separated
    const activitiesList = interestedActivities
      ? interestedActivities.split(/[,،]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const bioText = personalDescription && personalDescription.toLowerCase() !== "not specified"
      ? personalDescription
      : "";

    // 5. Build the complete profile details draft objects
    const profileDetails = {
      mn_basic_details_draft: {
        fullName,
        name: fullName,
        dob,
        age: age.toString(),
        gender: sanitizedGender,
        location,
        presentLocation: location,
        maritalStatus: maritalStatus || "Never Married",
        height: height || "",
        aboutMe: bioText,
        profileCreatedBy: "Admin Support (Instant Campaign)"
      },
      mn_religious_info_draft: {
        religion: religion || "Muslim",
        community: caste || "Sunni",
        caste: caste || "Sunni",
        religiousness: religiousness || "Religious"
      },
      mn_professional_info_draft: {
        education: highestEducation || "",
        profession: professionType || "",
        professionType: professionType || "",
        companyName: workplace || ""
      },
      mn_family_details_draft: {
        familyType: familyType || "Nuclear",
        financialStatus: financialStatus || "Middle-class",
        familyValues: familyValues || "Orthodox / Traditional"
      },
      mn_habits_draft: {
        eatingHabits: eatingHabits || "Any",
        smokingHabits: smokingHabits || "No",
        drinkingHabits: drinkingHabits || "No"
      },
      mn_interests_draft: {
        interests: activitiesList,
        aboutMe: bioText
      },
      mn_profile_photos_draft: {
        photos: []
      }
    };

    // 6. Create User inside database
    const newUser = await prisma.user.create({
      data: {
        first_name: fullName,
        last_name: "",
        mobile_number: mobile,
        password: hashedPassword,
        dob,
        gender: sanitizedGender,
        location,
        cast: caste || "Sunni",
        profile_for: "Myself",
        status: "active", // Mark active immediately
        kyc_status: "VERIFIED", // Mark KYC Verified instantly since verified by Admin physically
        kyc_front_url: documentUrl,
        profile_details: profileDetails as any
      }
    });

    // 7. Return computed response
    const profileId = `MN-${100000 + newUser.id}`;

    return {
      userId: newUser.id,
      profileId,
      fullName,
      mobile,
      rawPassword,
      gender: sanitizedGender,
      location,
      caste: caste || "Sunni",
      documentUrl,
      dateOfBirth: dob
    };
  }
}
export default InstantRegistrationUseCase;
