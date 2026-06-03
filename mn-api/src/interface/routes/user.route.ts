import express, { Request, Response } from "express";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { LoginUser, RegisterUser } from "../../applications/use-cases";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { GetAllUsers } from "../../applications/use-cases/user/GetAllUsers.usecase";
import { OtpRepository } from "../../infrastructure/repositories/OtpRepository";
import { UpdateProfileDetailsUseCase } from "../../applications/use-cases/user/UpdateProfileDetails.usecase";


const user_route = express.Router();
const userRepository = new UserRepository();
const otpRepository = new OtpRepository();
const registerUser = new RegisterUser(userRepository);
const loginUser = new LoginUser(userRepository)
const sendOtp = new SendOtpUseCase(otpRepository)
const getAllUsers = new GetAllUsers(userRepository)
const updateProfileDetails = new UpdateProfileDetailsUseCase(userRepository)
const userController = new UserController(
loginUser,
registerUser,
sendOtp,
getAllUsers,
updateProfileDetails
);

user_route.post('/register', async (req: Request, res: Response) => { await userController.register(req, res)});
user_route.post('/login',async (req:Request,res:Response) => {await userController.login(req,res)})
user_route.get('/profiles', async (req: Request, res: Response) => { await userController.getProfiles(req, res)});
user_route.put('/:id/profile', async (req: Request, res: Response) => { await userController.updateProfile(req, res)});
user_route.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid user ID" });
      return;
    }
    const user = await userRepository.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    // Remove password hash from response for security
    const { password, ...safeUser } = user as any;
    res.status(200).json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch user" });
  }
});


export default user_route;