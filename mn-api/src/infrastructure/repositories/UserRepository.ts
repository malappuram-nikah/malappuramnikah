import { User } from "../../domain/entities/user.interface";
import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import prisma from "../prisma/prisamClient";
import bcrypt from 'bcryptjs'
import { mergeProfileDetails } from "../../application/services/ProfileSectionService";


export class UserRepository implements IUserRepository {
    async createUser(data: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
        try {
            console.log('Attempting to store user:', data);
            const newUser = await prisma.user.create({ data });
            console.log('User successfully stored:', newUser);
            return newUser;
        } catch (error: any) {
            if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint failed'))) {
                console.warn('User creation failed due to unique constraint:', error.meta);
                const target = error.meta?.target;
                const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');
                if (targetStr.includes('email') || (error.message && error.message.includes('email'))) {
                    throw new Error('Email address is already registered. Please log in or use a different email.');
                }
                if (targetStr.includes('mobile_number') || (error.message && error.message.includes('mobile_number'))) {
                    throw new Error('Mobile number is already registered. Please log in instead.');
                }
                if (targetStr.includes('referral_code') || (error.message && error.message.includes('referral_code'))) {
                    throw new Error('Referral code already exists');
                }
                throw new Error('User with these details is already registered. Please log in instead.');
            }
            console.error('Error storing user:', error);
            throw error;
        }
    }

    async findByMobile(identifier: string): Promise<User | null> {
        if (!identifier) return null;
        const clean = identifier.trim();
        const digits = clean.replace(/\D/g, "");
        const rawDigits10 = digits.length >= 10 ? digits.slice(-10) : digits;

        const profileIdMatch = clean.match(/^MN-?(\d+)$/i);
        const resolvedId = profileIdMatch ? parseInt(profileIdMatch[1], 10) - 100000 : null;

        const OR: any[] = [
            { mobile_number: clean },
            { mobile_number: `+91${rawDigits10}` },
            { mobile_number: rawDigits10 },
            { mobile_number: `0${rawDigits10}` },
            { email: { equals: clean, mode: "insensitive" } },
        ];

        if (resolvedId && !isNaN(resolvedId)) {
            OR.push({ id: resolvedId });
        }

        return prisma.user.findFirst({
            where: { OR },
        });
    }

    async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    async findAll(filters?: { gender?: string; status?: string; limit?: number; ids?: number[]; lightweight?: boolean }): Promise<User[]> {
        const whereClause: any = {};
        if (filters?.gender) {
            whereClause.gender = { equals: filters.gender, mode: 'insensitive' };
        }
        if (filters?.status) {
            whereClause.status = filters.status;
        }

        if (filters?.ids && filters.ids.length > 0) {
            whereClause.id = { in: filters.ids };
        }

        if (filters?.lightweight) {
            // Use queryRaw for lightweight jsonb extraction to save memory/bandwidth
            const conditions: any[] = [];
            if (filters.gender) conditions.push(`u.gender ILIKE '${filters.gender}'`);
            if (filters.status) conditions.push(`u.status = '${filters.status}'`);
            if (filters.ids && filters.ids.length > 0) {
                conditions.push(`u.id IN (${filters.ids.join(',')})`);
            }
            const whereStr = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const limitStr = filters.limit ? `LIMIT ${filters.limit}` : '';
            
            const query = `
              SELECT u.id, u.uuid, u.first_name, u.last_name, u.gender, u.cast, u.location, u.dob, u.status, u.is_premium, u.profile_for, u.mobile_number, u.kyc_status, u.kyc_document_type, u.kyc_rejected_reason, u.kyc_submitted_at, u.kyc_verified_at, u.created_at, u.updated_at,
              jsonb_build_object(
                'mn_basic_details_draft', u.profile_details->'mn_basic_details_draft',
                'mn_profile_photos_draft', u.profile_details->'mn_profile_photos_draft',
                'mn_career_details_draft', u.profile_details->'mn_career_details_draft',
                'mn_religious_info_draft', u.profile_details->'mn_religious_info_draft'
              ) as profile_details
              FROM "user" u
              ${whereStr}
              ORDER BY u.created_at DESC
              ${limitStr}
            `;
            return prisma.$queryRawUnsafe(query) as Promise<User[]>;
        }

        return prisma.user.findMany({
            where: whereClause,
            take: filters?.limit,
            select: {
                id: true,
                uuid: true,
                first_name: true,
                last_name: true,
                gender: true,
                cast: true,
                location: true,
                dob: true,
                status: true,
                is_premium: true,
                profile_for: true,
                mobile_number: true,
                kyc_status: true,
                kyc_document_type: true,
                kyc_rejected_reason: true,
                kyc_submitted_at: true,
                kyc_verified_at: true,
                created_at: true,
                updated_at: true,
                profile_details: true
            },
            orderBy: {
                created_at: 'desc'
            }
        }) as any;
    }

    async updateProfileDetails(id: number, profileDetails: any, coreFields?: any): Promise<User> {
        try {
            const existing = await prisma.user.findUnique({
                where: { id },
                select: { profile_details: true },
            });

            const dataToUpdate: any = {};
            if (profileDetails !== undefined) {
                dataToUpdate.profile_details = mergeProfileDetails(
                    (existing?.profile_details || {}) as Record<string, unknown>,
                    profileDetails as Record<string, unknown>
                );

                const merged = dataToUpdate.profile_details as Record<string, unknown>;
                const basic = (merged.mn_basic_details_draft || {}) as Record<string, unknown>;
                const religious = (merged.mn_religious_info_draft || {}) as Record<string, unknown>;

                if (basic.name) {
                    const parts = String(basic.name).trim().split(/\s+/);
                    dataToUpdate.first_name = parts[0] || "";
                    dataToUpdate.last_name = parts.slice(1).join(" ") || "";
                }
                if (basic.gender) {
                    dataToUpdate.gender = basic.gender;
                }
                if (basic.presentLocation || basic.location) {
                    dataToUpdate.location = basic.presentLocation || basic.location;
                }
                if (basic.age) {
                    const birthYear = new Date().getFullYear() - parseInt(String(basic.age), 10);
                    if (!isNaN(birthYear)) {
                        dataToUpdate.dob = `${birthYear}-01-01`;
                    }
                }
                if (religious.community) {
                    dataToUpdate.cast = religious.community;
                }
                if (basic.profileFor) {
                    dataToUpdate.profile_for = basic.profileFor;
                }
            }
            if (coreFields) {
                if (coreFields.first_name !== undefined) dataToUpdate.first_name = coreFields.first_name;
                if (coreFields.last_name !== undefined) dataToUpdate.last_name = coreFields.last_name;
                // mobile_number is strictly protected from general profile updates
                if (coreFields.location !== undefined) dataToUpdate.location = coreFields.location;
                if (coreFields.dob !== undefined) dataToUpdate.dob = coreFields.dob;
                if (coreFields.cast !== undefined) dataToUpdate.cast = coreFields.cast;
                if (coreFields.gender !== undefined) dataToUpdate.gender = coreFields.gender;
                if (coreFields.profile_for !== undefined) dataToUpdate.profile_for = coreFields.profile_for;
            }
            const updatedUser = await prisma.user.update({
                where: { id },
                data: dataToUpdate
            });
            return updatedUser as unknown as User;
        } catch (error) {
            console.error('Error updating user profile details:', error);
            throw new Error('Failed to update profile details');
        }
    }

    async findById(identifier: number | string): Promise<User | null> {
        try {
            if (typeof identifier === "number") {
                return await prisma.user.findUnique({
                    where: { id: identifier }
                }) as unknown as User | null;
            }

            const numericId = parseInt(identifier, 10);
            if (!isNaN(numericId) && String(numericId) === String(identifier)) {
                return await prisma.user.findFirst({
                    where: {
                        OR: [
                            { id: numericId },
                            { uuid: identifier }
                        ]
                    }
                }) as unknown as User | null;
            }

            return await prisma.user.findUnique({
                where: { uuid: identifier }
            }) as unknown as User | null;
        } catch (error) {
            console.error('Error finding user by ID or UUID:', error);
            throw new Error('Failed to find user');
        }
    }

    async updateLastLogin(id: number): Promise<void> {
        try {
            await prisma.user.update({
                where: { id },
                data: { last_login: new Date() }
            });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }
}
