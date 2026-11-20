import { apiError, databaseError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId) || sessionId.length > 255) return apiError("INVALID_QUERY", "A valid Checkout session is required.", 400);
  const admin = createSupabaseAdminClient();
  const { data: order, error } = await admin.from("orders").select("id,listing_id,status,currency,amount_total,paid_at").eq("stripe_checkout_session_id", sessionId).maybeSingle();
  if (error) return databaseError(error, "Order status could not be loaded.");
  if (!order) return apiError("NOT_FOUND", "Order not found.", 404);
  const { data: listing, error: listingError } = await admin.from("listings").select("title,image_url").eq("id", order.listing_id).maybeSingle();
  if (listingError) return databaseError(listingError, "Order listing could not be loaded.");
  return Response.json({ data: { ...order, listing } }, { headers: { "Cache-Control": "private, no-store" } });
}
