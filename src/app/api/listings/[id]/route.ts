import { apiError, databaseError, isUuid } from "@/lib/api";
import type { DataResponse, ListingRecord } from "@/lib/api-types";
import { createSupabaseClient } from "@/lib/supabase";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id)) return apiError("INVALID_ID", "Listing id must be a valid UUID.", 400);
  const { data, error } = await createSupabaseClient().from("listings").select("id,title,description,price,category,seller_email,owner_id,image_url,location,created_at,updated_at").eq("id", id).maybeSingle();
  if (error) return databaseError(error, "Listing could not be loaded.");
  if (!data) return apiError("NOT_FOUND", "Listing not found.", 404);
  return Response.json({ data: data as ListingRecord } satisfies DataResponse<ListingRecord>, { headers: { "Cache-Control": "private, no-store" } });
}
