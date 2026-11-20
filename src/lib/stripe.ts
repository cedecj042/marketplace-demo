import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  stripeClient ??= new Stripe(secretKey, { appInfo: { name: "Marketplace Demo", version: "1.0.0" } });
  return stripeClient;
}

export function getSiteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]") url.protocol = "http:";
    return url.origin;
  }
  return new URL(request.url).origin;
}

export async function getStripeAccountStatus(accountId: string) {
  const account = await getStripe().v2.core.accounts.retrieve(accountId, {
    include: ["configuration.merchant", "requirements"],
  });
  const cardStatus = account.configuration?.merchant?.capabilities?.card_payments?.status ?? "pending";
  const payoutStatus = account.configuration?.merchant?.capabilities?.stripe_balance?.payouts?.status ?? "pending";
  const requirementsDue = account.requirements?.entries?.length ?? 0;
  const chargesEnabled = cardStatus === "active";
  const payoutsEnabled = payoutStatus === "active";

  return {
    details_submitted: requirementsDue === 0,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    ready: chargesEnabled && payoutsEnabled,
    card_status: cardStatus,
    payout_status: payoutStatus,
    requirements_due: requirementsDue,
  };
}
