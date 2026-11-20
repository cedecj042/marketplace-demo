import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return Response.json({ error: "Webhook signature configuration is missing." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") await handleCheckoutCompleted(event);
    else if (event.type === "account.updated") await handleAccountUpdated(event);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", { eventId: event.id, eventType: event.type, error });
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.marketplace !== "marketplace-demo" || session.payment_status !== "paid") return;
  const orderId = session.metadata.order_id;
  if (!orderId) return;
  const admin = createSupabaseAdminClient();
  const { data: order, error } = await admin.from("orders").select("id,listing_id,buyer_id,seller_id,status,stripe_account_id,stripe_checkout_session_id").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.stripe_checkout_session_id !== session.id || order.stripe_account_id !== event.account) return;
  if (!(await claimEvent(event))) return;

  try {
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    const buyerEmail = session.customer_details?.email ?? session.customer_email ?? null;
    const paidAt = new Date().toISOString();
    const { error: orderError } = await admin.from("orders").update({ status: "paid", buyer_email: buyerEmail, stripe_payment_intent_id: paymentIntentId, paid_at: paidAt }).eq("id", order.id);
    if (orderError) throw orderError;
    const { data: listing, error: listingError } = await admin.from("listings").update({ status: "sold", sold_at: paidAt }).eq("id", order.listing_id).select("title").single();
    if (listingError) throw listingError;

    const notifications = [{ user_id: order.seller_id, type: "order", title: "Your listing sold", body: `${listing.title} was purchased successfully.`, href: `/item/${order.listing_id}` }];
    if (order.buyer_id) notifications.push({ user_id: order.buyer_id, type: "payment", title: "Payment successful", body: `Your purchase of ${listing.title} is confirmed.`, href: `/checkout/success?session_id=${session.id}` });
    const { error: notificationError } = await admin.from("notifications").insert(notifications);
    if (notificationError) throw notificationError;
  } catch (error) {
    await releaseEvent(event.id);
    throw error;
  }
}

async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("id,stripe_charges_enabled,stripe_payouts_enabled").eq("stripe_account_id", account.id).maybeSingle();
  if (error) throw error;
  if (!profile || (event.account && event.account !== account.id) || !(await claimEvent(event))) return;
  try {
    const becameReady = account.details_submitted && account.charges_enabled && account.payouts_enabled && (!profile.stripe_charges_enabled || !profile.stripe_payouts_enabled);
    const { error: updateError } = await admin.from("profiles").update({ stripe_details_submitted: account.details_submitted, stripe_charges_enabled: account.charges_enabled, stripe_payouts_enabled: account.payouts_enabled }).eq("id", profile.id);
    if (updateError) throw updateError;
    if (becameReady) {
      const { error: notificationError } = await admin.from("notifications").insert({ user_id: profile.id, type: "payment", title: "Stripe payments are ready", body: "Buyers can now purchase your active listings.", href: "/profile" });
      if (notificationError) throw notificationError;
    }
  } catch (error) {
    await releaseEvent(event.id);
    throw error;
  }
}

async function claimEvent(event: Stripe.Event) {
  const { error } = await createSupabaseAdminClient().from("stripe_webhook_events").insert({ id: event.id, event_type: event.type });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

async function releaseEvent(eventId: string) {
  const { error } = await createSupabaseAdminClient().from("stripe_webhook_events").delete().eq("id", eventId);
  if (error) console.error("Stripe webhook event claim could not be released", { eventId, error });
}
