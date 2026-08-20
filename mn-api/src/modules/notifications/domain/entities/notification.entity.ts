export interface NotificationEntity {
  id: number;
  user_id: number;
  sender_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationPreferenceEntity {
  id: number;
  user_id: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  created_at: Date;
  updated_at: Date;
}
