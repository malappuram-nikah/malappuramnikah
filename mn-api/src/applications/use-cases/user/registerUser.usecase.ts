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
                        }
                    });
                    return updatedUser as unknown as User;
                }
            }
        }

        if (data.password) {
            const hashedPassword = await this.hashPassword(data.password);
            const userData = {
                ...data,
                password: hashedPassword,
            } as User;

            return this.userRepository.createUser(userData);
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
