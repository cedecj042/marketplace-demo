import { apiError, databaseError, emailPattern, isRecord, isUuid, parsePositiveInteger, readJson } from "@/lib/api";
import type { DataResponse, MessageRecord, PaginatedResponse } from "@/lib/api-types";
import { createSupabaseClient } from "@/lib/supabase";

const messageColumns = "id,listing_id,buyer_email,seller_email,message,created_at";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const listingId = params.get("listingId")?.trim() ?? "";
  const limit = parsePositiveInteger(params.get("limit"), 50, 100);
  const offset = parsePositiveInteger(params.get("offset"), 0, 100_000);
  if (!isUuid(listingId)) return apiError("INVALID_QUERY", "listingId must be a valid UUID.", 400);
  if (limit === null || limit < 1) return apiError("INVALID_QUERY", "limit must be an integer between 1 and 100.", 400);
  if (offset === null) return apiError("INVALID_QUERY", "offset must be an integer between 0 and 100000.", 400);
  const { data, error, count } = await createSupabaseClient().from("messages").select(messageColumns, { count: "exact" }).eq("listing_id", listingId).order("created_at", { ascending: true }).range(offset, offset + limit - 1);
  if (error) return databaseError(error, "Messages could not be loaded.");
  return Response.json({ data: (data ?? []) as MessageRecord[], pagination: { limit, offset, total: count ?? 0 } } satisfies PaginatedResponse<MessageRecord>, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const parsed = await readJson(request); if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);
  const body = parsed.value;
  const listingId = typeof body.listing_id === "string" ? body.listing_id.trim() : "";
  const buyerEmail = typeof body.buyer_email === "string" ? body.buyer_email.trim().toLowerCase() : "";
  const sellerEmail = typeof body.seller_email === "string" ? body.seller_email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const fields: Record<string, string> = {};
  if (!isUuid(listingId)) fields.listing_id = "Must be a valid UUID.";
  if (!emailPattern.test(buyerEmail) || buyerEmail.length > 255) fields.buyer_email = "Must be a valid email address.";
  if (!emailPattern.test(sellerEmail) || sellerEmail.length > 255) fields.seller_email = "Must be a valid email address.";
  if (message.length < 10 || message.length > 2000) fields.message = "Must be between 10 and 2000 characters.";
  if (Object.keys(fields).length) return apiError("VALIDATION_ERROR", "One or more fields are invalid.", 422, fields);
  const { data, error } = await createSupabaseClient().from("messages").insert({ listing_id: listingId, buyer_email: buyerEmail, seller_email: sellerEmail, message }).select(messageColumns).single();
  if (error) return databaseError(error, "Message could not be sent.");
  return Response.json({ data: data as MessageRecord } satisfies DataResponse<MessageRecord>, { status: 201, headers: { Location: `/api/messages?listingId=${listingId}` } });
}
