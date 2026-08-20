export interface MessageEntity {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: Date;
  sender?: {
    id: number;
    email?: string | null;
    member_profile?: any;
  };
  receiver?: {
    id: number;
    email?: string | null;
    member_profile?: any;
  };
}

export interface ConversationSummary {
  participantId: number;
  participantName: string;
  participantPhoto?: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}
