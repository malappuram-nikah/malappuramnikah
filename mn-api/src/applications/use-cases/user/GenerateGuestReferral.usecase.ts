import prisma from "../../../infrastructure/prisma/prisamClient";
import bcrypt from "bcryptjs";

export class GenerateGuestReferralUseCase {
    async execute(name: string, mobileNumber: string, password?: string): Promise<string> {
        if (!name || !mobileNumber) {
            throw new Error("Name and Mobile Number are required");
        }

        // Clean up mobile number (remove spaces)
        const cleanMobile = mobileNumber.replace(/\s+/g, '');

        // 1. Check if user exists
        let user = await prisma.user.findUnique({
            where: { mobile_number: cleanMobile }
        });

        // 2. If user exists, return or generate referral code
        if (user) {
            if (user.referral_code) {
                return user.referral_code;
            }
        }

        // 3. Generate a unique referral code
        let referralCode = "";
        let isUnique = false;
        const prefix = (name || "USER").replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase();
        while (!isUnique) {
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            referralCode = `${prefix}${randomPart}`;
            const existing = await prisma.user.findUnique({ where: { referral_code: referralCode } });
            if (!existing) isUnique = true;
        }

        // 4. Update existing user or create a new inactive user
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { referral_code: referralCode }
            });
        } else {
            const hashedPassword = password ? await bcrypt.hash(password.trim(), 10) : "GUEST_PASSWORD_DO_NOT_USE";
            await prisma.user.create({
                data: {
                    mobile_number: cleanMobile,
                    first_name: name,
                    last_name: "",
                    password: hashedPassword,
                    profile_for: "Myself",
                    gender: "Unknown",
                    location: "Unknown",
                    dob: "1990-01-01",
                    cast: "Other",
                    status: "referral_only",
                    referral_code: referralCode,
                }
            });
        }

        return referralCode;
    }
}
