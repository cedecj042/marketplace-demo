import { apiError, databaseError, isRecord, parsePositiveInteger, readJson } from "@/lib/api";
import type { DataResponse, ListingRecord, PaginatedResponse } from "@/lib/api-types";
import { createSupabaseClient } from "@/lib/supabase";
import { requireClaims } from "@/lib/supabase-server";

const listingColumns = "id,title,description,price,category,seller_email,owner_id,image_url,location,status,sold_at,created_at,updated_at";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim() ?? "";
  const category = params.get("category")?.trim() ?? "";
  const limit = parsePositiveInteger(params.get("limit"), 20, 100);
  const offset = parsePositiveInteger(params.get("offset"), 0, 100_000);
  const minPrice = parsePriceFilter(params.get("minPrice"));
  const maxPrice = parsePriceFilter(params.get("maxPrice"));

  if (limit === null || limit < 1) return apiError("INVALID_QUERY", "limit must be an integer between 1 and 100.", 400);
  if (offset === null) return apiError("INVALID_QUERY", "offset must be an integer between 0 and 100000.", 400);
  if (search.length > 100) return apiError("INVALID_QUERY", "search cannot exceed 100 characters.", 400);
  if (category.length > 100) return apiError("INVALID_QUERY", "category cannot exceed 100 characters.", 400);
  if (minPrice === null || maxPrice === null) return apiError("INVALID_QUERY", "Price filters must be non-negative numbers.", 400);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) return apiError("INVALID_QUERY", "minPrice cannot exceed maxPrice.", 400);

  let query = createSupabaseClient().from("listings").select(listingColumns, { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (search) query = query.ilike("title", `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  if (category) query = query.eq("category", category);
  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);

  const { data, error, count } = await query;
  if (error) return databaseError(error, "Listings could not be loaded.");
  return Response.json({ data: (data ?? []) as ListingRecord[], pagination: { limit, offset, total: count ?? 0 } } satisfies PaginatedResponse<ListingRecord>, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to create a listing.", 401);
  const sellerEmail = typeof claims.email === "string" ? claims.email.toLowerCase() : "";
  if (!sellerEmail) return apiError("ACCOUNT_EMAIL_REQUIRED", "Your account needs a verified email address.", 403);
  const parsed = await readJson(request); if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);
  const body = parsed.value;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "Palo Alto, CA";
  const imageUrl = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const fields: Record<string, string> = {};

  if (title.length < 3 || title.length > 255) fields.title = "Must be between 3 and 255 characters.";
  if (!Number.isFinite(price) || price <= 0 || price > 99_999_999.99) fields.price = "Must be greater than 0 and no more than 99999999.99.";
  if (!category || category.length > 100) fields.category = "Must be between 1 and 100 characters.";
  if (description.length > 10_000) fields.description = "Cannot exceed 10000 characters.";
  if (!location || location.length > 255) fields.location = "Must be between 1 and 255 characters.";
  if (imageUrl && (!isHttpUrl(imageUrl) || imageUrl.length > 2048)) fields.image_url = "Must be a valid HTTP or HTTPS URL.";
  if (Object.keys(fields).length) return apiError("VALIDATION_ERROR", "One or more fields are invalid.", 422, fields);

  const { data, error } = await supabase.from("listings").insert({ title, description: description || null, price, category, seller_email: sellerEmail, owner_id: claims.sub, image_url: imageUrl, location }).select(listingColumns).single();
  if (error) return databaseError(error, "Listing could not be created.");
  return Response.json({ data: data as ListingRecord } satisfies DataResponse<ListingRecord>, { status: 201, headers: { Location: `/api/listings/${data.id}` } });
}

function parsePriceFilter(value: string | null) { if (value === null || value === "") return undefined; const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : null; }
function isHttpUrl(value: string) { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
