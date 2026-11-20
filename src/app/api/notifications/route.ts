import { apiError, databaseError, isRecord, isUuid, parsePositiveInteger, readJson } from "@/lib/api";
import type { DataResponse, NotificationRecord } from "@/lib/api-types";
import { requireClaims } from "@/lib/supabase-server";

const columns = "id,user_id,type,title,body,href,read_at,created_at";

export async function GET(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to view notifications.", 401);
  const limit = parsePositiveInteger(new URL(request.url).searchParams.get("limit"), 30, 100);
  if (limit === null || limit < 1) return apiError("INVALID_QUERY", "limit must be between 1 and 100.", 400);
  const { data, error } = await supabase.from("notifications").select(columns).eq("user_id", claims.sub).order("created_at", { ascending: false }).limit(limit);
  if (error) return databaseError(error, "Notifications could not be loaded.");
  return Response.json({ data: (data ?? []) as NotificationRecord[] } satisfies DataResponse<NotificationRecord[]>, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to update notifications.", 401);
  const parsed = await readJson(request);
  if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);
  const id = typeof parsed.value.id === "string" ? parsed.value.id.trim() : "";
  const markAll = parsed.value.mark_all === true;
  if (!markAll && !isUuid(id)) return apiError("VALIDATION_ERROR", "Provide a notification id or mark_all.", 422);

  let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", claims.sub).is("read_at", null);
  if (!markAll) query = query.eq("id", id);
  const { error } = await query;
  if (error) return databaseError(error, "Notification could not be updated.");
  return Response.json({ data: { updated: true } } satisfies DataResponse<{ updated: boolean }>);
}
