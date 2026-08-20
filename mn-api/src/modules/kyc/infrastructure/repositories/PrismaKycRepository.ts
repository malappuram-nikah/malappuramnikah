import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { prisma } from "../../../../infrastructure/database/prisma.service";
import { socketService } from "../../../../infrastructure/websocket/socket.service";

export class PrismaKycRepository implements IKycRepository {
  async updateUserKyc(
    userId: number,
    documentType: string,
    frontFileName: string,
    backFileName: string | null
  ): Promise<any> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        kyc_status: "PENDING",
        kyc_document_type: documentType,
        kyc_front_url: frontFileName,
        kyc_back_url: backFileName,
        kyc_rejected_reason: null,
        kyc_submitted_at: new Date(),
      },
    });
  }

  async getUserKycInfo(userId: number): Promise<{
    kyc_status: string;
    kyc_front_url: string | null;
    kyc_back_url: string | null;
    profile_details: any;
    mobile_number: string;
  } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kyc_status: true,
        kyc_front_url: true,
        kyc_back_url: true,
        profile_details: true,
        mobile_number: true,
      },
    });
    return user;
  }

  async createNotification(userId: number, title: string, message: string, type: string): Promise<void> {
    const notif = await prisma.notification.create({
      data: {
        user_id: userId,
        sender_id: 2,
        type,
        title,
        message,
        is_read: false,
      },
    });

    socketService.emitToUser(userId, "notification", {
      id: notif.id,
      type,
      title,
      message,
      created_at: notif.created_at,
    });
  }
}
