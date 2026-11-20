"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

export function StripeOnboardingRedirect() {
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/api/stripe/connect", { method: "POST" }).then(async (response) => {
      const text = await response.text();
      if (!text) throw new Error(`The server returned an empty response (HTTP ${response.status}).`);
      const body = JSON.parse(text) as { data?: { url?: string }; error?: { message?: string } };
      if (!response.ok || !body.data?.url) throw new Error(body.error?.message || "Stripe onboarding could not be resumed.");
      window.location.replace(body.data.url);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Stripe onboarding could not be resumed."));
  }, []);
  return <main className="grid min-h-[calc(100vh-4.5rem)] place-items-center px-4"><div className="glass-panel max-w-md rounded-[24px] p-8 text-center">{error ? <><h1 className="text-xl font-semibold">Unable to resume onboarding</h1><p className="mt-2 text-sm text-red-600">{error}</p></> : <><LoaderCircle className="mx-auto size-8 animate-spin text-[#5b5cf0]" /><h1 className="mt-4 text-xl font-semibold">Returning to Stripe…</h1><p className="mt-2 text-sm text-muted-foreground">Creating a fresh secure onboarding link.</p></>}</div></main>;
}
