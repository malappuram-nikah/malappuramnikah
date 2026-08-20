export type InterestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface InterestEntity {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: InterestStatus;
  created_at: Date;
  updated_at: Date;
  sender?: {
    id: number;
    email?: string | null;
    profile?: any;
  };
  receiver?: {
    id: number;
    email?: string | null;
    profile?: any;
  };
}

export interface BlockEntity {
  id: number;
  blocker_id: number;
  blocked_id: number;
  created_at: Date;
  blocker?: { id: number; email?: string | null; profile?: any };
  blocked?: { id: number; email?: string | null; profile?: any };
}

export interface FavouriteEntity {
  id: number;
  favouriter_id: number;
  favourited_id: number;
  created_at: Date;
  favouriter?: { id: number; email?: string | null; profile?: any };
  favourited?: { id: number; email?: string | null; profile?: any };
}

export interface ProfileViewEntity {
  id: number;
  viewer_id: number;
  viewed_id: number;
  created_at: Date;
  viewer?: { id: number; email?: string | null; profile?: any };
  viewed?: { id: number; email?: string | null; profile?: any };
}

export interface InteractionHistoryItem {
  type: "INTEREST_SENT" | "INTEREST_RECEIVED" | "BLOCK" | "FAVOURITE" | "PROFILE_VIEW";
  id: number;
  targetUserId: number;
  status?: string;
  created_at: Date;
  targetUser?: {
    id: number;
    name?: string;
    profile_for?: string;
    gender?: string;
    photo?: string | null;
  };
}

export interface UnifiedInteractionHistory {
  sentInterests: InterestEntity[];
  receivedInterests: InterestEntity[];
  blockedUsers: BlockEntity[];
  favourites: FavouriteEntity[];
  profileViews: ProfileViewEntity[];
}
