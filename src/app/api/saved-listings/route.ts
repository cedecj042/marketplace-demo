import { apiError, databaseError, isRecord, isUuid, readJson } from "@/lib/api";
import type { DataResponse, ListingRecord } from "@/lib/api-types";
import { requireClaims } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to view saved listings.", 401);

  const params = new URL(request.url).searchParams;
  const listingId = params.get("listing_id")?.trim() ?? "";
  const idsOnly = params.get("idsOnly") === "true";
  if (listingId && !isUuid(listingId)) return apiError("INVALID_QUERY", "listing_id must be a valid UUID.", 400);

  let query = supabase.from("saved_listings").select("listing_id,listing:listings(id,title,description,price,category,seller_email,owner_id,image_url,location,status,sold_at,created_at,updated_at)").eq("user_id", claims.sub).order("created_at", { ascending: false });
  if (listingId) query = query.eq("listing_id", listingId);
  const { data, error } = await query;
  if (error) return databaseError(error, "Saved listings could not be loaded.");

  if (idsOnly) {
    return Response.json({ data: (data ?? []).map((row) => row.listing_id) } satisfies DataResponse<string[]>, { headers: { "Cache-Control": "private, no-store" } });
  }

  const listings = (data ?? []).flatMap((row) => row.listing ? [row.listing as unknown as ListingRecord] : []);
  return Response.json({ data: listings } satisfies DataResponse<ListingRecord[]>, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to save a listing.", 401);
  const parsed = await readJson(request);
  if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);
  const listingId = typeof parsed.value.listing_id === "string" ? parsed.value.listing_id.trim() : "";
  if (!isUuid(listingId)) return apiError("VALIDATION_ERROR", "A valid listing_id is required.", 422, { listing_id: "Must be a UUID." });

  const { error } = await supabase.from("saved_listings").upsert({ user_id: claims.sub, listing_id: listingId }, { onConflict: "user_id,listing_id", ignoreDuplicates: true });
  if (error) return databaseError(error, "Listing could not be saved.");
  return Response.json({ data: { listing_id: listingId, saved: true } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to update saved listings.", 401);
  const listingId = new URL(request.url).searchParams.get("listing_id")?.trim() ?? "";
  if (!isUuid(listingId)) return apiError("INVALID_QUERY", "listing_id must be a valid UUID.", 400);
  const { error } = await supabase.from("saved_listings").delete().eq("user_id", claims.sub).eq("listing_id", listingId);
  if (error) return databaseError(error, "Saved listing could not be removed.");
  return new Response(null, { status: 204 });
}
