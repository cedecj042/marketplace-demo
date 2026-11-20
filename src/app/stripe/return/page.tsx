import { redirect } from "next/navigation";
import { StripeOnboardingReturn } from "@/components/payments/stripe-onboarding-return";
import { requireClaims } from "@/lib/supabase-server";

export default async function StripeReturnPage() {
  const { claims } = await requireClaims();
  if (!claims) redirect("/auth/login");
  return <StripeOnboardingReturn />;
}
