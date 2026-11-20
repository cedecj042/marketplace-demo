import { redirect } from "next/navigation";
import { StripeOnboardingRedirect } from "@/components/payments/stripe-onboarding-redirect";
import { requireClaims } from "@/lib/supabase-server";

export default async function StripeRefreshPage() {
  const { claims } = await requireClaims();
  if (!claims) redirect("/auth/login");
  return <StripeOnboardingRedirect />;
}
