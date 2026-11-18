import "server-only";

import { connection } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { getItem, type MarketplaceItem } from "@/lib/marketplace-data";

export type ListingDetail = MarketplaceItem & { sellerEmail: string; isDatabaseListing: boolean };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fallbackImage = "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=85";

export async function getListingDetail(id: string): Promise<ListingDetail | undefined> {
  const mock = getItem(id);
  if (mock) return { ...mock, sellerEmail: "", isDatabaseListing: false };
  if (!uuidPattern.test(id)) return undefined;

  await connection();
  const { data, error } = await createSupabaseClient().from("listings").select("id,title,description,price,category,seller_email,image_url,location,created_at").eq("id", id).single();
  if (error || !data) return undefined;
  return {
    id: data.id, title: data.title, description: data.description ?? "No description provided.", price: Number(data.price),
    category: data.category, sellerEmail: data.seller_email, seller: data.seller_email.split("@")[0], image: data.image_url ?? fallbackImage,
    location: data.location ?? "Palo Alto, CA", condition: "Listed item", posted: `Listed ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(data.created_at))}`,
    isDatabaseListing: true,
  };
}
