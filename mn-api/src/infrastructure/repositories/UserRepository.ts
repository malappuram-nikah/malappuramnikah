import { User } from "../../domain/entities/user.interface";
import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import prisma from "../prisma/prisamClient";
import bcrypt from 'bcryptjs'


export class UserRepository implements IUserRepository {
    async createUser(data: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
        try {
            console.log('Attempting to store user:', data);
            const newUser = await prisma.user.create({ data });
            console.log('User successfully stored:', newUser);
            return newUser;
        } catch (error: any) {
            console.error('Error storing user:', error);
            if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint failed'))) {
                const target = error.meta?.target;
                const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');
                if (targetStr.includes('email') || (error.message && error.message.includes('email'))) {
                    throw new Error('Email address already registered');
                }
                if (targetStr.includes('mobile_number') || (error.message && error.message.includes('mobile_number'))) {
                    throw new Error('Mobile number already registered');
                }
                if (targetStr.includes('referral_code') || (error.message && error.message.includes('referral_code'))) {
                    throw new Error('Referral code already exists');
                }
                throw new Error('User with these details already registered');
            }
            throw error;
        }
    }

    async findByMobile(mobileNumber: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: { mobile_number: mobileNumber },
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
              SELECT u.id, u.first_name, u.last_name, u.gender, u.cast, u.location, u.dob, u.status, u.is_premium, u.profile_for, u.mobile_number, u.kyc_status, u.kyc_document_type, u.kyc_front_url, u.kyc_back_url, u.kyc_rejected_reason, u.kyc_submitted_at, u.kyc_verified_at, u.created_at, u.updated_at,
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
                kyc_front_url: true,
                kyc_back_url: true,
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
            const dataToUpdate: any = {};
            if (profileDetails !== undefined) {
                dataToUpdate.profile_details = profileDetails;

                // Sync core fields from profile details drafts if not explicitly overridden by coreFields
                if (profileDetails) {
                    const basic = profileDetails.mn_basic_details_draft || {};
                    const religious = profileDetails.mn_religious_info_draft || {};

                    if (basic.name) {
                        const parts = basic.name.trim().split(/\s+/);
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
                        const birthYear = new Date().getFullYear() - parseInt(basic.age, 10);
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
            }
            if (coreFields) {
                if (coreFields.first_name !== undefined) dataToUpdate.first_name = coreFields.first_name;
                if (coreFields.last_name !== undefined) dataToUpdate.last_name = coreFields.last_name;
                if (coreFields.mobile_number !== undefined) dataToUpdate.mobile_number = coreFields.mobile_number;
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

    async findById(id: number): Promise<User | null> {
        try {
            return await prisma.user.findUnique({
                where: { id }
            }) as unknown as User | null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
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
