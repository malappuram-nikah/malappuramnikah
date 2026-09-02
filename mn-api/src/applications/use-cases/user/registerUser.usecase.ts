import { User } from "../../../domain/entities/user.interface";
import { IUserRepository } from "../../../domain/interfaces/IUserRepository";
import bcrypt from "bcryptjs";
import prisma from "../../../infrastructure/prisma/prisamClient";

export class RegisterUser {
    constructor(private userRepository: IUserRepository) {}

    async execute(data: Partial<User>): Promise<User> {
        this.validateInput(data);
        console.log('Validated data:', data);

        const existingUser = data.mobile_number ? await this.userRepository.findByMobile(data.mobile_number) : null;

        if (data.email && data.email.trim() !== "") {
            const cleanEmail = data.email.trim();
            const existingEmailUser = await prisma.user.findFirst({
                where: { email: { equals: cleanEmail, mode: "insensitive" } }
            });

            if (existingEmailUser) {
                if (!existingUser || existingEmailUser.id !== existingUser.id) {
                    throw new Error("Email address is already registered. Please log in or use a different email.");
                }
            }
        }

        if (data.mobile_number) {
            if (existingUser) {
                if (existingUser.status === "active") {
                    throw new Error("Mobile number already registered. Please log in instead.");
                } else {
                    // Update the existing unverified user's details
                    const hashedPassword = data.password ? await this.hashPassword(data.password) : existingUser.password;
                    
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

                    const initialMaritalStatus = (data as any).marital_status || (data as any).maritalStatus || "Never Married";
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
                            referral_code: referralCode
                        }
                    });

                    // Check if referred by someone
                    const refCode = (data as any).referred_by_code?.toUpperCase();
                    if (refCode) {
                        const referrerUser = await prisma.user.findUnique({ where: { referral_code: refCode } });
                        if (referrerUser && referrerUser.id !== existingUser.id) {
                            const existingReferral = await prisma.referral.findUnique({
                                where: { referred_user_id: existingUser.id as number }
                            });
                            if (!existingReferral) {
                                const referral = await prisma.referral.create({
                                    data: {
                                        referrer_id: referrerUser.id,
                                        referred_user_id: existingUser.id as number,
                                        referral_code: refCode,
                                        status: "PENDING",
                                        rewarded: false
                                    }
                                });

                                // Check settings to award signup points immediately
                                let settings = await prisma.referralSettings.findUnique({ where: { id: 1 } });
                                if (!settings) {
                                    settings = await prisma.referralSettings.create({
                                        data: {
                                            id: 1,
                                            points_per_referral: 100,
                                            reward_condition: "SIGNUP",
                                            enabled: true,
                                            max_referral: 100,
                                            daily_limit: 10
                                        }
                                    });
                                }

                                const pointsPerReferral = settings.points_per_referral;
                                const isEnabled = settings.enabled;
                                const condition = settings.reward_condition;

                                if (isEnabled && condition === "SIGNUP") {
                                    await prisma.$transaction([
                                        prisma.referralTransaction.create({
                                            data: {
                                                user_id: referrerUser.id,
                                                referral_id: referral.id,
                                                points: pointsPerReferral,
                                                type: "EARN",
                                                reason: "Referral Signup Bonus"
                                            }
                                        }),
                                        prisma.user.update({
                                            where: { id: referrerUser.id },
                                            data: {
                                                referral_points: { increment: pointsPerReferral }
                                            }
                                        }),
                                        prisma.referral.update({
                                            where: { id: referral.id },
                                            data: {
                                                status: "SUCCESS",
                                                rewarded: true
                                            }
                                        }),
                                        prisma.notification.create({
                                            data: {
                                                user_id: referrerUser.id,
                                                sender_id: existingUser.id as number,
                                                type: "REFERRAL_REWARD",
                                                title: "Referral Reward Earned! 🎉",
                                                message: `Your friend ${data.first_name || existingUser.first_name} joined. You earned ${pointsPerReferral} points.`
                                            }
                                        })
                                    ]);
                                } else {
                                    await prisma.notification.create({
                                        data: {
                                            user_id: referrerUser.id,
                                            sender_id: existingUser.id as number,
                                            type: "REFERRAL_JOINED",
                                            title: "Friend Joined! 🤝",
                                            message: `Your friend ${data.first_name || existingUser.first_name} registered. Points will be awarded once they verify their identity.`
                                        }
                                    });
                                }
                            }
                        }
                    }

                    return updatedUser as unknown as User;
                }
            }
        }

        if (data.password) {
            const hashedPassword = await this.hashPassword(data.password);
            
            // Generate a unique referral code
            let referralCode = "";
            let isUnique = false;
            const prefix = (data.first_name || "USER").replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase();
            while (!isUnique) {
                const randomPart = Math.floor(1000 + Math.random() * 9000);
                referralCode = `${prefix}${randomPart}`;
                const existing = await prisma.user.findUnique({ where: { referral_code: referralCode } });
                if (!existing) isUnique = true;
            }

            // Check if referred by someone
            const refCode = (data as any).referred_by_code?.toUpperCase();
            let referrerUser = null;
            if (refCode) {
                referrerUser = await prisma.user.findUnique({ where: { referral_code: refCode } });
                if (!referrerUser) {
                    throw new Error("Invalid referral code");
                }
            }

            const { referred_by_code, marital_status, maritalStatus, channel, ...restData } = data as any;
            const initialMaritalStatus = marital_status || maritalStatus || "Never Married";
            const initialDetails = restData.profile_details || {
                basicDetails: { maritalStatus: initialMaritalStatus },
                mn_basic_details_draft: { maritalStatus: initialMaritalStatus },
            };

            const userData = {
                ...restData,
                password: hashedPassword,
                referral_code: referralCode,
                referral_points: 0,
                profile_details: initialDetails,
            } as User;

            const newUser = await this.userRepository.createUser(userData);

            if (referrerUser && newUser.id) {
                const referral = await prisma.referral.create({
                    data: {
                        referrer_id: referrerUser.id,
                        referred_user_id: newUser.id as number,
                        referral_code: refCode,
                        status: "PENDING",
                        rewarded: false
                    }
                });

                // Check settings to award signup points immediately
                let settings = await prisma.referralSettings.findUnique({ where: { id: 1 } });
                if (!settings) {
                    settings = await prisma.referralSettings.create({
                        data: {
                            id: 1,
                            points_per_referral: 100,
                            reward_condition: "SIGNUP",
                            enabled: true,
                            max_referral: 100,
                            daily_limit: 10
                        }
                    });
                }

                const pointsPerReferral = settings.points_per_referral;
                const isEnabled = settings.enabled;
                const condition = settings.reward_condition;

                if (isEnabled && condition === "SIGNUP") {
                    await prisma.$transaction([
                        prisma.referralTransaction.create({
                            data: {
                                user_id: referrerUser.id,
                                referral_id: referral.id,
                                points: pointsPerReferral,
                                type: "EARN",
                                reason: "Referral Signup Bonus"
                            }
                        }),
                        prisma.user.update({
                            where: { id: referrerUser.id },
                            data: {
                                referral_points: { increment: pointsPerReferral }
                            }
                        }),
                        prisma.referral.update({
                            where: { id: referral.id },
                            data: {
                                status: "SUCCESS",
                                rewarded: true
                            }
                        }),
                        prisma.notification.create({
                            data: {
                                user_id: referrerUser.id,
                                sender_id: newUser.id as number,
                                type: "REFERRAL_REWARD",
                                title: "Referral Reward Earned! 🎉",
                                message: `Your friend ${newUser.first_name} joined. You earned ${pointsPerReferral} points.`
                            }
                        })
                    ]);
                } else {
                    await prisma.notification.create({
                        data: {
                            user_id: referrerUser.id,
                            sender_id: newUser.id as number,
                            type: "REFERRAL_JOINED",
                            title: "Friend Joined! 🤝",
                            message: `Your friend ${newUser.first_name} registered. Points will be awarded once they verify their identity.`
                        }
                    });
                }
            }

            return newUser;
        } else {
            throw new Error("Password is required");
        }
    }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 10; 
        return bcrypt.hash(password, saltRounds);
    }

    private validateInput(data: Partial<User>): void {
        const requiredFields: (keyof User)[] = ['first_name', 'last_name', 'mobile_number', 'password', 'location', 'dob', 'cast'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        this.validateMobileNumber(data.mobile_number!);
        this.validatePassword(data.password!);

        if (data.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                throw new Error("Enter a valid email address");
            }
        }
    }

    private validateMobileNumber(mobileNumber: string): void {
        const knownCodes = ["+971", "+966", "+974", "+968", "+965", "+973", "+91", "+44", "+1"];
        const countryCode = knownCodes.find((code) => mobileNumber.startsWith(code));

        if (!countryCode) {
            if (!mobileNumber.startsWith("+") || mobileNumber.replace(/\D/g, "").length < 8) {
                throw new Error("Enter a valid mobile number with country code");
            }
            return;
        }

        const digits = mobileNumber.slice(countryCode.length).replace(/\D/g, "");

        if (countryCode === "+91") {
            if (digits.length !== 10) {
                throw new Error("Indian mobile number must be exactly 10 digits");
            }
            if (!/^[6-9]/.test(digits)) {
                throw new Error("Indian mobile number must start with 6, 7, 8, or 9");
            }
            return;
        }

        if (countryCode === "+971") {
            if (digits.length !== 9) {
                throw new Error("UAE mobile number must be exactly 9 digits");
            }
            return;
        }

        if (countryCode === "+966") {
            if (digits.length !== 9) {
                throw new Error("Saudi mobile number must be exactly 9 digits");
            }
            if (!/^5/.test(digits)) {
                throw new Error("Saudi mobile number must start with 5");
            }
            return;
        }

        if (countryCode === "+968") {
            if (digits.length !== 8) {
                throw new Error("Oman mobile number must be exactly 8 digits");
            }
            return;
        }

        if (countryCode === "+974") {
            if (digits.length !== 8) {
                throw new Error("Qatar mobile number must be exactly 8 digits");
            }
            return;
        }

        if (countryCode === "+965") {
            if (digits.length !== 8) {
                throw new Error("Kuwait mobile number must be exactly 8 digits");
            }
            return;
        }

        if (countryCode === "+973") {
            if (digits.length !== 8) {
                throw new Error("Bahrain mobile number must be exactly 8 digits");
            }
            return;
        }

        if (countryCode === "+44") {
            if (digits.length !== 10 && digits.length !== 11) {
                throw new Error("UK mobile number must be 10 or 11 digits");
            }
            return;
        }

        if (countryCode === "+1") {
            if (digits.length !== 10) {
                throw new Error("US/Canada mobile number must be exactly 10 digits");
            }
            return;
        }

        if (digits.length < 7 || digits.length > 15) {
            throw new Error("Enter a valid mobile number");
        }
    }

    private validatePassword(password: string): void {
        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }
        if (password.length > 64) {
            throw new Error("Password must be 64 characters or fewer");
        }
        if (/\s/.test(password)) {
            throw new Error("Password cannot contain spaces");
        }
    }
}
