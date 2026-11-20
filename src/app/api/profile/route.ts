import { apiError, databaseError, isRecord, readJson } from "@/lib/api";
import type { DataResponse, ProfileRecord } from "@/lib/api-types";
import { requireClaims } from "@/lib/supabase-server";

const columns = "id,email,first_name,last_name,display_name,phone,location,bio,avatar_url,created_at,updated_at";

function accountEmail(claims: { email?: unknown }) {
  return typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
}

export async function GET() {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to view your profile.", 401);

  const { data, error } = await supabase.from("profiles").select(columns).eq("id", claims.sub).maybeSingle();
  if (error) return databaseError(error, "Your profile could not be loaded.");
  if (data) return Response.json({ data: data as ProfileRecord } satisfies DataResponse<ProfileRecord>, { headers: { "Cache-Control": "private, no-store" } });

  const email = accountEmail(claims);
  if (!email) return apiError("ACCOUNT_EMAIL_REQUIRED", "Your account needs a verified email address.", 403);
  const fallbackName = email.split("@")[0];
  const { data: created, error: createError } = await supabase.from("profiles").insert({ id: claims.sub, email, first_name: fallbackName, display_name: fallbackName }).select(columns).single();
  if (createError) return databaseError(createError, "Your profile could not be created.");
  return Response.json({ data: created as ProfileRecord } satisfies DataResponse<ProfileRecord>, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to edit your profile.", 401);
  const email = accountEmail(claims);
  if (!email) return apiError("ACCOUNT_EMAIL_REQUIRED", "Your account needs a verified email address.", 403);

  const parsed = await readJson(request);
  if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);

  const firstName = typeof parsed.value.first_name === "string" ? parsed.value.first_name.trim() : "";
  const lastName = typeof parsed.value.last_name === "string" ? parsed.value.last_name.trim() : "";
  const phone = typeof parsed.value.phone === "string" ? parsed.value.phone.trim() : "";
  const location = typeof parsed.value.location === "string" ? parsed.value.location.trim() : "";
  const bio = typeof parsed.value.bio === "string" ? parsed.value.bio.trim() : "";
  const fields: Record<string, string> = {};

  if (firstName.length < 1 || firstName.length > 80) fields.first_name = "Use between 1 and 80 characters.";
  if (lastName.length < 1 || lastName.length > 80) fields.last_name = "Use between 1 and 80 characters.";
  if (phone.length > 30) fields.phone = "Use 30 characters or fewer.";
  if (location.length > 255) fields.location = "Use 255 characters or fewer.";
  if (bio.length > 500) fields.bio = "Use 500 characters or fewer.";
  if (Object.keys(fields).length) return apiError("VALIDATION_ERROR", "Please correct the highlighted profile details.", 422, fields);

  const displayName = `${firstName} ${lastName}`.trim();
  const { data, error } = await supabase.from("profiles").upsert({ id: claims.sub, email, first_name: firstName, last_name: lastName, display_name: displayName, phone, location, bio }, { onConflict: "id" }).select(columns).single();
  if (error) return databaseError(error, "Your profile could not be saved.");
  return Response.json({ data: data as ProfileRecord } satisfies DataResponse<ProfileRecord>, { headers: { "Cache-Control": "private, no-store" } });
}
