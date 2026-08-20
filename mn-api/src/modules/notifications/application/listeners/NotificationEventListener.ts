import { eventBus, AppEvent } from "../../../../shared/events/EventBus";
import { CreateNotificationUseCase } from "../use-cases/CreateNotification.usecase";

export class NotificationEventListener {
  constructor(private createNotificationUseCase: CreateNotificationUseCase) {}

  registerListeners(): void {
    eventBus.subscribe("MESSAGE_SENT", this.handleMessageSent.bind(this));
    eventBus.subscribe("INTEREST_SENT", this.handleInterestSent.bind(this));
    eventBus.subscribe("KYC_APPROVED", this.handleKycApproved.bind(this));
    eventBus.subscribe("PROFILE_VIEWED", this.handleProfileViewed.bind(this));
  }

  private async handleMessageSent(event: AppEvent): Promise<void> {
    const { senderId, receiverId, content } = event.payload;
    await this.createNotificationUseCase.execute({
      userId: receiverId,
      senderId,
      type: "NEW_MESSAGE",
      title: "New Message Received",
      message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
    });
  }

  private async handleInterestSent(event: AppEvent): Promise<void> {
    const { senderId, receiverId, senderName } = event.payload;
    await this.createNotificationUseCase.execute({
      userId: receiverId,
      senderId,
      type: "INTEREST_SENT",
      title: "New Interest Received",
      message: `${senderName || "A member"} expressed interest in your profile.`,
    });
  }

  private async handleKycApproved(event: AppEvent): Promise<void> {
    const { userId } = event.payload;
    await this.createNotificationUseCase.execute({
      userId,
      senderId: 0,
      type: "KYC_APPROVED",
      title: "KYC Verified! 🎉",
      message: "Congratulations! Your identity verification (KYC) has been approved.",
    });
  }

  private async handleProfileViewed(event: AppEvent): Promise<void> {
    const { viewerId, viewedId } = event.payload;
    await this.createNotificationUseCase.execute({
      userId: viewedId,
      senderId: viewerId,
      type: "PROFILE_VIEW",
      title: "Profile Viewed",
      message: "Someone viewed your profile.",
    });
  }
}
