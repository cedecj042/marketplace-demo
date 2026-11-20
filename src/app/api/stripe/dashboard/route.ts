import { apiError, databaseError } from "@/lib/api";
import { getSiteOrigin, getStripe } from "@/lib/stripe";
import { requireClaims } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const redirectToStripe = new URL(request.url).searchParams.get("redirect") === "1";
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to open your Stripe dashboard.", 401);
  const { data: profile, error } = await supabase.from("profiles").select("stripe_account_id,stripe_details_submitted").eq("id", claims.sub).maybeSingle();
  if (error) return databaseError(error, "Stripe account details could not be loaded.");
  if (!profile?.stripe_account_id) return apiError("STRIPE_NOT_CONNECTED", "Connect Stripe before opening the dashboard.", 409);
  try {
    const origin = getSiteOrigin(request);
    const dashboardLink = await getStripe().v2.core.accountLinks.create({ account: profile.stripe_account_id, use_case: { type: "account_dashboard", account_dashboard: { refresh_url: `${origin}/profile` } } });
    if (redirectToStripe) return Response.redirect(dashboardLink.url, 303);
    return Response.json({ data: { url: dashboardLink.url } });
  } catch (error) {
    console.error("Stripe dashboard link failed", error);
    const message = error instanceof Error && error.message.length <= 500 ? error.message : "Stripe dashboard could not be opened.";
    return apiError("STRIPE_ERROR", message, 502);
  }
}
