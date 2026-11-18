export type ListingRecord = {
  id: string; title: string; description: string | null; price: number; category: string;
  seller_email: string; image_url: string | null; location: string; created_at: string; updated_at: string;
};

export type MessageRecord = {
  id: string; listing_id: string; buyer_email: string; seller_email: string; message: string; created_at: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: { limit: number; offset: number; total: number };
};

export type DataResponse<T> = { data: T };
