"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

type StripeStatus = { ready?: boolean };

export function StripeOnboardingReturn() {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Confirming your Stripe account…");

  useEffect(() => {
    let cancelled = false;

    async function synchronize() {
      for (let attempt = 0; attempt < 5 && !cancelled; attempt += 1) {
        const response = await fetch("/api/stripe/connect", { cache: "no-store" });
        const text = await response.text();
        const body = text ? JSON.parse(text) as { data?: StripeStatus; error?: { message?: string } } : null;
        if (!response.ok || !body?.data) throw new Error(body?.error?.message || "Stripe status could not be confirmed.");
        if (body.data.ready) {
          setReady(true);
          setMessage("Stripe payments are ready. Returning to your profile…");
          window.setTimeout(() => window.location.replace("/profile?stripe=connected"), 900);
          return;
        }
        if (attempt < 4) await new Promise((resolve) => window.setTimeout(resolve, 1200));
      }
      if (!cancelled) window.location.replace("/profile?stripe=pending");
    }

    void synchronize().catch((reason: unknown) => {
      if (cancelled) return;
      setMessage(reason instanceof Error ? reason.message : "Stripe status could not be confirmed.");
      window.setTimeout(() => window.location.replace("/profile?stripe=pending"), 2500);
    });
    return () => { cancelled = true; };
  }, []);

  return <main className="grid min-h-[calc(100vh-4.5rem)] place-items-center px-4">
    <div className="glass-panel max-w-md rounded-[24px] p-8 text-center">
      {ready ? <CheckCircle2 className="mx-auto size-9 text-emerald-600" /> : <LoaderCircle className="mx-auto size-9 animate-spin text-[#5b5cf0]" />}
      <h1 className="mt-4 text-xl font-semibold">{ready ? "Stripe connected" : "Finishing setup"}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  </main>;
}
