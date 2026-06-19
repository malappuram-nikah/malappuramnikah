import { User } from "../../../domain/entities/user.interface";
import { IUserRepository } from "../../../domain/interfaces/IUserRepository";
import bcrypt from "bcryptjs";

export class RegisterUser {
    constructor(private userRepository: IUserRepository) {}

    async execute(data: Partial<User>): Promise<User> {
        this.validateInput(data);
        console.log('Validated data:', data);

        if (data.mobile_number) {
            const existingUser = await this.userRepository.findByMobile(data.mobile_number);
            if (existingUser) {
                throw new Error("Mobile number already registered");
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
