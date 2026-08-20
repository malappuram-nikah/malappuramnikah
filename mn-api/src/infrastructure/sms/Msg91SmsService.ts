import { ISmsService } from "../../shared/sms/ISmsService";
import { Msg91Service } from "../service/Msg91Service";
import { WhatsappOtpService } from "../service/WhatsappOtpService";

export class Msg91SmsService implements ISmsService {
  async sendOtpSms(mobileNumber: string, otp: string): Promise<boolean> {
    const smsSuccess = await Msg91Service.sendOtp(mobileNumber, otp);
    if (smsSuccess) return true;
    const waRes = await WhatsappOtpService.sendOtp(mobileNumber, otp);
    return waRes.success;
  }
}
