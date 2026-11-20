import { apiError, databaseError } from "@/lib/api";
import { getSiteOrigin, getStripe, getStripeAccountStatus } from "@/lib/stripe";
import { requireClaims } from "@/lib/supabase-server";

const profileColumns = "id,email,first_name,last_name,stripe_account_id,stripe_details_submitted,stripe_charges_enabled,stripe_payouts_enabled";

export async function GET() {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to view Stripe onboarding.", 401);
  const { data: profile, error } = await supabase.from("profiles").select(profileColumns).eq("id", claims.sub).maybeSingle();
  if (error) return databaseError(error, "Payment status could not be loaded.");
  if (!profile) return apiError("PROFILE_REQUIRED", "Complete your profile before connecting Stripe.", 409);
  if (!profile.stripe_account_id) return Response.json({ data: { email: profile.email, connected: false, details_submitted: false, charges_enabled: false, payouts_enabled: false, ready: false } }, { headers: { "Cache-Control": "private, no-store" } });

  try {
    const status = await getStripeAccountStatus(profile.stripe_account_id);
    const { error: updateError } = await supabase.from("profiles").update({ stripe_details_submitted: status.details_submitted, stripe_charges_enabled: status.charges_enabled, stripe_payouts_enabled: status.payouts_enabled }).eq("id", claims.sub);
    if (updateError) return databaseError(updateError, "Payment status could not be saved.");
    return Response.json({ data: { email: profile.email, connected: true, ...status } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Stripe account retrieval failed", error);
    return apiError("STRIPE_ERROR", "Stripe payment status could not be checked.", 502);
  }
}

export async function POST(request: Request) {
  const redirectToStripe = new URL(request.url).searchParams.get("redirect") === "1";
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to connect Stripe.", 401);
  const { data: profile, error } = await supabase.from("profiles").select(profileColumns).eq("id", claims.sub).maybeSingle();
  if (error) return databaseError(error, "Your profile could not be loaded.");
  if (!profile) return apiError("PROFILE_REQUIRED", "Complete your profile before connecting Stripe.", 409);

  try {
    const stripe = getStripe();
    let accountId = profile.stripe_account_id;
    if (!accountId) {
      const configuredCountry = process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase() || "US";
      const displayName = `${profile.first_name} ${profile.last_name}`.trim() || profile.email;
      const recentAccounts = await stripe.v2.core.accounts.list({ limit: 20 });
      const existingAccount = recentAccounts.data.find((account) => account.metadata?.marketplace_user_id === claims.sub);
      const account = existingAccount ?? await stripe.v2.core.accounts.create({
          contact_email: profile.email,
          display_name: displayName,
          dashboard: "full",
          identity: { country: configuredCountry },
          configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
          defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
          metadata: { marketplace_user_id: claims.sub },
          include: ["configuration.merchant", "requirements"],
        }, { idempotencyKey: `marketplace-connect-${claims.sub}` });
      accountId = account.id;
      const { error: saveError } = await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", claims.sub);
      if (saveError) return databaseError(saveError, "Stripe account could not be linked to your profile.");
    }

    const origin = getSiteOrigin(request);
    const accountLink = await stripe.v2.core.accountLinks.create({ account: accountId, use_case: { type: "account_onboarding", account_onboarding: { refresh_url: `${origin}/stripe/refresh`, return_url: `${origin}/stripe/return`, collection_options: { fields: "eventually_due", future_requirements: "include" } } } });
    if (redirectToStripe) return Response.redirect(accountLink.url, 303);
    return Response.json({ data: { url: accountLink.url } });
  } catch (error) {
    console.error("Stripe onboarding failed", error);
    return apiError("STRIPE_ERROR", stripeErrorMessage(error, "Stripe onboarding could not be started. Check the server configuration and try again."), 502);
  }
}

function stripeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && error.message.length <= 500) return error.message;
  return fallback;
}
