import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { prisma } from "../../../../infrastructure/database/prisma.service";
import { socketService } from "../../../../infrastructure/websocket/socket.service";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../../shared/errors/AppError";

export class ExpressInterestUseCase {
  constructor(private interestRepository: IInterestRepository) {}

  async execute(senderId: number, receiverId: number): Promise<{ message: string; status: string; requireKyc?: boolean; kycStatus?: string }> {
    if (isNaN(receiverId) || senderId === receiverId) {
      throw new BadRequestError("Invalid receiver ID");
    }

    const senderUser = await this.interestRepository.getUserForInterestCheck(senderId);
    const receiverUser = await this.interestRepository.getUserForInterestCheck(receiverId);

    if (!senderUser || !receiverUser) {
      throw new NotFoundError("User not found");
    }

    if (senderUser.kyc_status !== "VERIFIED") {
      return {
        message: "Identity verification required. Please upload your ID document (Aadhaar/Passport) to express interest and connect with matches.",
        status: "KYC_REQUIRED",
        requireKyc: true,
        kycStatus: senderUser.kyc_status,
      };
    }

    const senderGender = (senderUser.gender || "").toLowerCase();
    const receiverGender = (receiverUser.gender || "").toLowerCase();
    if (senderGender && receiverGender && senderGender === receiverGender) {
      throw new ForbiddenError("Access forbidden. Cannot express interest in same-gender profiles.");
    }

    const existingInterest = await this.interestRepository.findInterest(senderId, receiverId);

    if (existingInterest) {
      if (existingInterest.status === "ACCEPTED") {
        return { message: "Interest already accepted", status: "ACCEPTED" };
      }

      await this.interestRepository.deleteInterest(existingInterest.id);
      await prisma.notification.deleteMany({
        where: { user_id: receiverId, sender_id: senderId, type: "INTEREST_SENT" },
      });

      return { message: "Interest withdrawn", status: "NONE" };
    }

    const newInterest = await this.interestRepository.createInterest(senderId, receiverId);

    const reverseInterest = await this.interestRepository.findInterest(receiverId, senderId);

    if (reverseInterest) {
      await this.interestRepository.updateInterestStatus(newInterest.id, "ACCEPTED");
      await this.interestRepository.updateInterestStatus(reverseInterest.id, "ACCEPTED");

      await prisma.notification.create({
        data: {
          user_id: senderId,
          sender_id: receiverId,
          type: "INTEREST_ACCEPTED",
          title: "It's a Match! 🎉",
          message: `${receiverUser.first_name} ${receiverUser.last_name} shown interest in you! You can now start chatting.`,
        },
      });

      await prisma.notification.create({
        data: {
          user_id: receiverId,
          sender_id: senderId,
          type: "INTEREST_ACCEPTED",
          title: "It's a Match! 🎉",
          message: `Mutual interest with ${senderUser.first_name} ${senderUser.last_name}! You can now start chatting.`,
        },
      });

      socketService.emitToUser(senderId, "interest_match", {
        peer: {
          id: receiverUser.id,
          first_name: receiverUser.first_name,
          last_name: receiverUser.last_name,
          location: receiverUser.location,
          profile_details: receiverUser.profile_details,
        },
      });
      socketService.emitToUser(receiverId, "interest_match", {
        peer: {
          id: senderUser.id,
          first_name: senderUser.first_name,
          last_name: senderUser.last_name,
          location: senderUser.location,
          profile_details: senderUser.profile_details,
        },
      });

      socketService.emitToUser(senderId, "notification", {
        type: "INTEREST_ACCEPTED",
        title: "It's a Match! 🎉",
        message: `Mutual match with ${receiverUser.first_name}! Chatting is now unlocked.`,
      });
      socketService.emitToUser(receiverId, "notification", {
        type: "INTEREST_ACCEPTED",
        title: "It's a Match! 🎉",
        message: `Mutual match with ${senderUser.first_name}! Chatting is now unlocked.`,
      });

      return { message: "Mutual interest established!", status: "ACCEPTED" };
    }

    await prisma.notification.create({
      data: {
        user_id: receiverId,
        sender_id: senderId,
        type: "INTEREST_SENT",
        title: "New Interest Received",
        message: `${senderUser.first_name} ${senderUser.last_name} is interested in your profile.`,
      },
    });

    socketService.emitToUser(receiverId, "notification", {
      type: "INTEREST_SENT",
      title: "New Interest",
      message: `${senderUser.first_name} is interested in your profile.`,
    });

    return { message: "Interest expressed successfully", status: "PENDING" };
  }
}
