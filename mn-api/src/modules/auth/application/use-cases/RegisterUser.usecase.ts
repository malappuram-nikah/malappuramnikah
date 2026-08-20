import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserEntity } from "../../domain/entities/user.entity";
import { prisma } from "../../../../infrastructure/database/prisma.service";
import { BadRequestError, ConflictError } from "../../../../shared/errors/AppError";

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: Partial<UserEntity> & { marital_status?: string; maritalStatus?: string; referred_by_code?: string }): Promise<UserEntity> {
    this.validateInput(data);

    const existingUser = data.mobile_number ? await this.userRepository.findByMobile(data.mobile_number) : null;

    if (data.email && data.email.trim() !== "") {
      const cleanEmail = data.email.trim();
      const existingEmailUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });

      if (existingEmailUser) {
        if (!existingUser || existingEmailUser.id !== existingUser.id) {
          throw new ConflictError("Email address is already registered. Please log in or use a different email.");
        }
      }
    }

    if (data.mobile_number) {
      if (existingUser) {
        if (existingUser.status === "active") {
          throw new ConflictError("Mobile number already registered. Please log in instead.");
        } else {
          // Update the existing unverified user's details
          const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : existingUser.password;

          let referralCode = existingUser.referral_code;
          if (!referralCode) {
            let isUnique = false;
            const prefix = (data.first_name || existingUser.first_name || "USER").replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase();
            while (!isUnique) {
              const randomPart = Math.floor(1000 + Math.random() * 9000);
              referralCode = `${prefix}${randomPart}`;
              const existing = await prisma.user.findUnique({ where: { referral_code: referralCode } });
              if (!existing) isUnique = true;
            }
          }

          const initialMaritalStatus = data.marital_status || data.maritalStatus || "Never Married";
          const existingDetails = (existingUser.profile_details as Record<string, any>) || {};
          const mergedDetails = {
            ...existingDetails,
            basicDetails: {
              ...(existingDetails.basicDetails || {}),
              maritalStatus: initialMaritalStatus,
            },
            mn_basic_details_draft: {
              ...(existingDetails.mn_basic_details_draft || {}),
              maritalStatus: initialMaritalStatus,
            },
          };

          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              first_name: data.first_name || existingUser.first_name,
              last_name: data.last_name || existingUser.last_name,
              password: hashedPassword,
              location: data.location || existingUser.location,
              email: data.email || existingUser.email,
              dob: data.dob || existingUser.dob,
              cast: data.cast || existingUser.cast,
              profile_for: data.profile_for || existingUser.profile_for,
              gender: data.gender || existingUser.gender,
              profile_details: mergedDetails,
              referral_code: referralCode,
            },
          });

          return updatedUser as unknown as UserEntity;
        }
      }
    }

    if (!data.password) {
      throw new BadRequestError("Password is required");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    let referralCode = "";
    let isUnique = false;
    const prefix = (data.first_name || "USER").replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase();
    while (!isUnique) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      referralCode = `${prefix}${randomPart}`;
      const existing = await prisma.user.findUnique({ where: { referral_code: referralCode } });
      if (!existing) isUnique = true;
    }

    const initialMaritalStatus = data.marital_status || data.maritalStatus || "Never Married";
    const initialDetails = data.profile_details || {
      basicDetails: { maritalStatus: initialMaritalStatus },
      mn_basic_details_draft: { maritalStatus: initialMaritalStatus },
    };

    const userData: Partial<UserEntity> = {
      profile_for: data.profile_for,
      gender: data.gender,
      first_name: data.first_name,
      last_name: data.last_name,
      cast: data.cast,
      location: data.location,
      email: data.email,
      mobile_number: data.mobile_number,
      password: hashedPassword,
      dob: data.dob,
      status: "in_active",
      referral_code: referralCode,
      referral_points: 0,
      profile_details: initialDetails as Record<string, any>,
    };

    const newUser = await this.userRepository.createUser(userData);
    return newUser;
  }

  private validateInput(data: Partial<UserEntity>): void {
    const requiredFields: (keyof UserEntity)[] = ["first_name", "last_name", "mobile_number", "password", "location", "dob", "cast"];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new BadRequestError(`Missing required field: ${field}`);
      }
    }

    this.validateMobileNumber(data.mobile_number!);
    this.validatePassword(data.password!);

    if (data.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new BadRequestError("Enter a valid email address");
      }
    }
  }

  private validateMobileNumber(mobileNumber: string): void {
    const knownCodes = ["+966", "+971", "+91"];
    const countryCode = knownCodes.find((code) => mobileNumber.startsWith(code));

    if (!countryCode) {
      throw new BadRequestError("Enter a valid mobile number with country code");
    }

    const digits = mobileNumber.slice(countryCode.length).replace(/\D/g, "");

    if (countryCode === "+91") {
      if (digits.length !== 10) throw new BadRequestError("Indian mobile number must be exactly 10 digits");
      if (!/^[6-9]/.test(digits)) throw new BadRequestError("Indian mobile number must start with 6, 7, 8, or 9");
      return;
    }
    if (countryCode === "+971") {
      if (digits.length !== 9) throw new BadRequestError("UAE mobile number must be exactly 9 digits");
      return;
    }
    if (countryCode === "+966") {
      if (digits.length !== 9) throw new BadRequestError("Saudi mobile number must be exactly 9 digits");
      if (!/^5/.test(digits)) throw new BadRequestError("Saudi mobile number must start with 5");
      return;
    }

    if (digits.length < 8 || digits.length > 15) {
      throw new BadRequestError("Enter a valid mobile number");
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 6) throw new BadRequestError("Password must be at least 6 characters");
    if (password.length > 64) throw new BadRequestError("Password must be 64 characters or fewer");
    if (/\s/.test(password)) throw new BadRequestError("Password cannot contain spaces");
  }
}
