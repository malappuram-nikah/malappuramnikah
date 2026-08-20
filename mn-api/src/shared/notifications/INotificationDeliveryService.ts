export interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  type: string;
  senderId?: number;
}

export interface INotificationDeliveryService {
  sendInAppNotification(payload: NotificationPayload): Promise<void>;
  sendEmailNotification(userId: number, title: string, message: string): Promise<void>;
  sendSmsNotification(userId: number, message: string): Promise<void>;
  sendPushNotification(userId: number, title: string, message: string): Promise<void>;
}

export class DefaultNotificationDeliveryService implements INotificationDeliveryService {
  async sendInAppNotification(payload: NotificationPayload): Promise<void> {
    // In-app notifications are persisted to DB by NotificationRepository
  }

  async sendEmailNotification(userId: number, title: string, message: string): Promise<void> {
    // Log/dispatch to email provider
  }

  async sendSmsNotification(userId: number, message: string): Promise<void> {
    // Log/dispatch to SMS provider
  }

  async sendPushNotification(userId: number, title: string, message: string): Promise<void> {
    // Log/dispatch push notification
  }
}
