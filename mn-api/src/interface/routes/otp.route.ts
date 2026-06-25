


import express, { Request, Response } from "express";
import { OtpRepository } from "../../infrastructure/repositories/OtpRepository";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { VerifyOtpUseCase } from "../../applications/use-cases/user/VerifyOtp.usecase";
import { OtpController } from "../controllers/otp.controller";

const otp_route = express.Router()



const otpRepository = new OtpRepository();
const sendOtpUseCase = new SendOtpUseCase(otpRepository);
const verifyOtpUseCase = new VerifyOtpUseCase(otpRepository);
const otpController = new OtpController(sendOtpUseCase, verifyOtpUseCase);

otp_route.post("/resend-otp", async (req: Request, res: Response) => { await otpController.resendOtp(req, res) });
otp_route.post("/verify-otp", async (req: Request, res: Response) => { await otpController.verifyOtp(req, res) });


export default otp_route