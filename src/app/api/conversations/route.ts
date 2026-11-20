import { apiError, databaseError, isRecord, isUuid, readJson } from "@/lib/api";
import type { ConversationRecord, DataResponse } from "@/lib/api-types";
import { requireClaims } from "@/lib/supabase-server";

const columns = "id,listing_id,buyer_id,seller_id,buyer_email,seller_email,created_at,last_message_at,listing:listings(title,image_url)";

export async function GET() {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to view conversations.", 401);
  const { data, error } = await supabase.from("conversations").select(columns).order("last_message_at", { ascending: false });
  if (error) return databaseError(error, "Conversations could not be loaded.");
  return Response.json({ data: (data ?? []) as unknown as ConversationRecord[] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to start a conversation.", 401);
  const buyerEmail = typeof claims.email === "string" ? claims.email.toLowerCase() : "";
  if (!buyerEmail) return apiError("ACCOUNT_EMAIL_REQUIRED", "Your account needs a verified email address.", 403);
  const parsed = await readJson(request); if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);
  const listingId = typeof parsed.value.listing_id === "string" ? parsed.value.listing_id.trim() : "";
  if (!isUuid(listingId)) return apiError("VALIDATION_ERROR", "A valid listing_id is required.", 422, { listing_id: "Must be a UUID." });
  const { data: listing, error: listingError } = await supabase.from("listings").select("id,owner_id,seller_email").eq("id", listingId).maybeSingle();
  if (listingError) return databaseError(listingError, "Listing could not be loaded.");
  if (!listing?.owner_id) return apiError("NOT_AVAILABLE", "This legacy listing cannot receive account messages.", 409);
  if (listing.owner_id === claims.sub) return apiError("OWN_LISTING", "You cannot start a buyer conversation on your own listing.", 409);
  const { data: existing, error: existingError } = await supabase.from("conversations").select(columns).eq("listing_id", listing.id).eq("buyer_id", claims.sub).maybeSingle();
  if (existingError) return databaseError(existingError, "Conversation could not be loaded.");
  if (existing) return Response.json({ data: existing as unknown as ConversationRecord } satisfies DataResponse<ConversationRecord>, { headers: { Location: `/messages/${existing.id}` } });
  const { data, error } = await supabase.from("conversations").insert({ listing_id: listing.id, buyer_id: claims.sub, seller_id: listing.owner_id, buyer_email: buyerEmail, seller_email: listing.seller_email }).select(columns).single();
  if (error) return databaseError(error, "Conversation could not be started.");
  return Response.json({ data: data as unknown as ConversationRecord } satisfies DataResponse<ConversationRecord>, { status: 201, headers: { Location: `/messages/${data.id}` } });
}
