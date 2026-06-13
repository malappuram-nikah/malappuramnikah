import { User } from "../entities/user.interface";

export interface IUserRepository{
    createUser(user:Partial<User>):Promise<User>;
    findByMobile(mobile:string):Promise<User|null>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    findAll(): Promise<User[]>;
    updateProfileDetails(id: number, profileDetails: any, coreFields?: any): Promise<User>;
    findById(id: number): Promise<User | null>;
}