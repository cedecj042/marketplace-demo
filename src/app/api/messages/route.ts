import { apiError, databaseError, isRecord, isUuid, parsePositiveInteger, readJson } from "@/lib/api";
import type { ChatMessageRecord, DataResponse, PaginatedResponse } from "@/lib/api-types";
import { requireClaims } from "@/lib/supabase-server";

const columns = "id,conversation_id,sender_id,body,created_at";

export async function GET(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to view messages.", 401);
  const params = new URL(request.url).searchParams;
  const conversationId = params.get("conversationId")?.trim() ?? "";
  const limit = parsePositiveInteger(params.get("limit"), 100, 100);
  const offset = parsePositiveInteger(params.get("offset"), 0, 100_000);
  if (!isUuid(conversationId)) return apiError("INVALID_QUERY", "conversationId must be a valid UUID.", 400);
  if (limit === null || limit < 1 || offset === null) return apiError("INVALID_QUERY", "Pagination values are invalid.", 400);
  const { data, error, count } = await supabase.from("chat_messages").select(columns, { count: "exact" }).eq("conversation_id", conversationId).order("created_at", { ascending: true }).range(offset, offset + limit - 1);
  if (error) return databaseError(error, "Messages could not be loaded.");
  return Response.json({ data: (data ?? []) as ChatMessageRecord[], pagination: { limit, offset, total: count ?? 0 } } satisfies PaginatedResponse<ChatMessageRecord>, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to send messages.", 401);
  const parsed = await readJson(request); if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);
  const conversationId = typeof parsed.value.conversation_id === "string" ? parsed.value.conversation_id.trim() : "";
  const body = typeof parsed.value.body === "string" ? parsed.value.body.trim() : "";
  const fields: Record<string, string> = {};
  if (!isUuid(conversationId)) fields.conversation_id = "Must be a valid UUID.";
  if (body.length < 1 || body.length > 2000) fields.body = "Must be between 1 and 2000 characters.";
  if (Object.keys(fields).length) return apiError("VALIDATION_ERROR", "One or more fields are invalid.", 422, fields);
  const { data, error } = await supabase.from("chat_messages").insert({ conversation_id: conversationId, sender_id: claims.sub, body }).select(columns).single();
  if (error) return databaseError(error, "Message could not be sent.");
  return Response.json({ data: data as ChatMessageRecord } satisfies DataResponse<ChatMessageRecord>, { status: 201 });
}
