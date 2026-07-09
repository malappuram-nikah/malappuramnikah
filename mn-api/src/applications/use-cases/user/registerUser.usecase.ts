import { User } from "../../../domain/entities/user.interface";
import { IUserRepository } from "../../../domain/interfaces/IUserRepository";
import bcrypt from "bcryptjs";
import prisma from "../../../infrastructure/prisma/prisamClient";

export class RegisterUser {
    constructor(private userRepository: IUserRepository) {}

    async execute(data: Partial<User>): Promise<User> {
        this.validateInput(data);
        console.log('Validated data:', data);

        if (data.mobile_number) {
            const existingUser = await this.userRepository.findByMobile(data.mobile_number);
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

                    const updatedUser = await prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            first_name: data.first_name || existingUser.first_name,
                            last_name: data.last_name || existingUser.last_name,
                            password: hashedPassword,
                            location: data.location || existingUser.location,
                            dob: data.dob || existingUser.dob,
                            cast: data.cast || existingUser.cast,
                            profile_for: data.profile_for || existingUser.profile_for,
                            gender: data.gender || existingUser.gender,
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

            const { referred_by_code, ...restData } = data as any;
            const userData = {
                ...restData,
                password: hashedPassword,
                referral_code: referralCode,
                referral_points: 0
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
    }
}
