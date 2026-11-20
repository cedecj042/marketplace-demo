export type ListingRecord = {
  id: string; title: string; description: string | null; price: number; category: string;
  seller_email: string; owner_id: string | null; image_url: string | null; location: string; status: "active" | "sold"; sold_at: string | null; created_at: string; updated_at: string;
};

export type ConversationRecord = {
  id: string; listing_id: string; buyer_id: string; seller_id: string; buyer_email: string; seller_email: string;
  created_at: string; last_message_at: string; listing?: { title: string; image_url: string | null } | null;
};

export type ChatMessageRecord = {
  id: string; conversation_id: string; sender_id: string; body: string; created_at: string;
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

export type ProfileRecord = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: { limit: number; offset: number; total: number };
};

export type DataResponse<T> = { data: T };
