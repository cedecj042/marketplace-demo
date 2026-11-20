import { apiError, databaseError } from "@/lib/api";
import type { DataResponse, ListingRecord } from "@/lib/api-types";
import { requireClaims } from "@/lib/supabase-server";

const listingColumns = "id,title,description,price,category,seller_email,owner_id,image_url,location,status,sold_at,created_at,updated_at";

export async function GET() {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to view your listings.", 401);
  const { data, error } = await supabase.from("listings").select(listingColumns).eq("owner_id", claims.sub).order("created_at", { ascending: false });
  if (error) return databaseError(error, "Your listings could not be loaded.");
  return Response.json({ data: (data ?? []) as ListingRecord[] } satisfies DataResponse<ListingRecord[]>, { headers: { "Cache-Control": "private, no-store" } });
}
