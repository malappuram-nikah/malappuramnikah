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
        } catch (error) {
            console.error('Error storing user:', error);
            throw new Error('Failed to create user');
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

    async findAll(): Promise<User[]> {
        return prisma.user.findMany({
            select: {
                id: true,
                first_name: true,
                last_name: true,
                gender: true,
                cast: true,
                location: true,
                dob: true,
                status: true,
                is_premium: true
            }
        }) as any;
    }

    async updateProfileDetails(id: number, profileDetails: any): Promise<User> {
        try {
            const updatedUser = await prisma.user.update({
                where: { id },
                data: { profile_details: profileDetails }
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
}
