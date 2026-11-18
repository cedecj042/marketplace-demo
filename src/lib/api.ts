import type { PostgrestError } from "@supabase/supabase-js";

export type ApiErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string> };
};

export function apiError(code: string, message: string, status: number, fields?: Record<string, string>) {
  return Response.json({ error: { code, message, ...(fields && { fields }) } } satisfies ApiErrorBody, { status });
}

export function databaseError(error: PostgrestError, fallback = "The database operation failed.") {
  if (error.code === "23503") return apiError("RELATED_RECORD_NOT_FOUND", "The referenced listing does not exist.", 404);
  if (error.code === "23505") return apiError("CONFLICT", "A conflicting record already exists.", 409);
  console.error("Supabase API error", { code: error.code, message: error.message });
  return apiError("DATABASE_ERROR", fallback, 500);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parsePositiveInteger(value: string | null, fallback: number, maximum: number) {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= maximum ? parsed : null;
}

export async function readJson(request: Request): Promise<{ value?: unknown; response?: Response }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return { response: apiError("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.", 415) };
  try { return { value: await request.json() }; } catch { return { response: apiError("INVALID_JSON", "Request body must contain valid JSON.", 400) }; }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
