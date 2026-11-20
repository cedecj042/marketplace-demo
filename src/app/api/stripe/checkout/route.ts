import { apiError, databaseError, isRecord, isUuid, readJson } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSiteOrigin, getStripe } from "@/lib/stripe";
import { requireClaims } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const listingId = new URL(request.url).searchParams.get("listing_id")?.trim() ?? "";
  if (!isUuid(listingId)) return apiError("INVALID_QUERY", "listing_id must be a valid UUID.", 400);
  const { claims } = await requireClaims();
  const availability = await getAvailability(listingId, claims?.sub ?? null);
  if (availability.response) return availability.response;
  return Response.json({ data: availability.data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const parsed = await readJson(request);
  if (parsed.response) return parsed.response;
  if (!isRecord(parsed.value)) return apiError("VALIDATION_ERROR", "Request body must be a JSON object.", 422);
  const listingId = typeof parsed.value.listing_id === "string" ? parsed.value.listing_id.trim() : "";
  if (!isUuid(listingId)) return apiError("VALIDATION_ERROR", "A valid listing_id is required.", 422, { listing_id: "Must be a UUID." });

  const { claims } = await requireClaims();
  const availability = await getAvailability(listingId, claims?.sub ?? null);
  if (availability.response) return availability.response;
  const { listing, seller } = availability;
  if (!availability.data.available) return apiError("NOT_PURCHASABLE", availability.data.message, 409);
  if (!listing.owner_id || !seller?.stripe_account_id) return apiError("SELLER_NOT_READY", "This seller has not enabled Stripe payments yet.", 409);
  const stripeAccountId = seller.stripe_account_id;

  const amountTotal = Math.round(Number(listing.price) * 100);
  if (!Number.isSafeInteger(amountTotal) || amountTotal < 1) return apiError("INVALID_PRICE", "This listing has an invalid price.", 409);
  const platformFee = Math.round(amountTotal * 0.1);
  const admin = createSupabaseAdminClient();
  const buyerEmail = typeof claims?.email === "string" ? claims.email.toLowerCase() : null;
  const { data: order, error: orderError } = await admin.from("orders").insert({ listing_id: listing.id, buyer_id: claims?.sub ?? null, seller_id: listing.owner_id, buyer_email: buyerEmail, amount_total: amountTotal, platform_fee: platformFee, currency: "php", stripe_account_id: stripeAccountId }).select("id").single();
  if (orderError) return databaseError(orderError, "The order could not be started.");

  try {
    const origin = getSiteOrigin(request);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.id,
      customer_email: buyerEmail ?? undefined,
      line_items: [{ quantity: 1, price_data: { currency: "php", unit_amount: amountTotal, product_data: { name: listing.title, description: listing.description?.slice(0, 500) || undefined, images: listing.image_url ? [listing.image_url] : undefined } } }],
      payment_intent_data: { application_fee_amount: platformFee, metadata: { order_id: order.id, listing_id: listing.id, marketplace: "marketplace-demo" } },
      metadata: { order_id: order.id, listing_id: listing.id, marketplace: "marketplace-demo" },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/item/${listing.id}?checkout=canceled`,
    }, { stripeAccount: stripeAccountId });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    const { error: updateError } = await admin.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
    if (updateError) throw updateError;
    return Response.json({ data: { url: session.url } }, { status: 201 });
  } catch (error) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    console.error("Stripe Checkout creation failed", error);
    return apiError("STRIPE_ERROR", "Stripe Checkout could not be opened. Please try again.", 502);
  }
}

async function getAvailability(listingId: string, currentUserId: string | null) {
  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    console.error("Stripe checkout configuration is incomplete", error);
    return { response: apiError("SERVER_CONFIGURATION_ERROR", "Payments are not fully configured on the server. Add SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY) and restart the app.", 503) };
  }
  const { data: listing, error } = await admin.from("listings").select("id,title,description,price,image_url,owner_id,status").eq("id", listingId).maybeSingle();
  if (error) return { response: databaseError(error, "Listing payment details could not be loaded.") };
  if (!listing) return { response: apiError("NOT_FOUND", "Listing not found.", 404) };
  if (!listing.owner_id) return { listing, seller: null, data: { available: false, reason: "legacy_listing", message: "This listing is not connected to a seller account." } };
  const { data: seller, error: sellerError } = await admin.from("profiles").select("stripe_account_id,stripe_details_submitted,stripe_charges_enabled,stripe_payouts_enabled").eq("id", listing.owner_id).maybeSingle();
  if (sellerError) return { response: databaseError(sellerError, "Seller payment details could not be loaded.") };
  if (listing.status === "sold") return { listing, seller, data: { available: false, reason: "sold", message: "This listing has been sold." } };
  if (currentUserId === listing.owner_id) return { listing, seller, data: { available: false, reason: "own_listing", message: "You cannot purchase your own listing." } };
  const ready = Boolean(seller?.stripe_account_id && seller.stripe_details_submitted && seller.stripe_charges_enabled && seller.stripe_payouts_enabled);
  if (!ready) return { listing, seller, data: { available: false, reason: "seller_not_ready", message: "This seller has not enabled Stripe payments yet." } };
  return { listing, seller: seller as typeof seller & { stripe_account_id: string }, data: { available: true, reason: "available", message: "Available for secure checkout." } };
}
