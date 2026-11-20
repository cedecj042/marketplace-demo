"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, AtSign, CheckCircle2, CreditCard, ExternalLink, Landmark, LoaderCircle, ShieldCheck } from "lucide-react";

type ConnectStatus = { email: string; connected: boolean; details_submitted: boolean; charges_enabled: boolean; payouts_enabled: boolean; ready: boolean; card_status?: string; payout_status?: string; requirements_due?: number };

export function StripeConnectCard() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/stripe/connect", { cache: "no-store" });
      const body = await readApiResponse<{ data?: ConnectStatus; error?: { message?: string } }>(response);
      if (!response.ok || !body.data) throw new Error(body.error?.message || "Stripe status could not be loaded.");
      setStatus(body.data);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Stripe status could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    const refresh = () => void loadStatus();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [loadStatus]);

  const paymentState = status?.charges_enabled ? "Active" : status?.connected ? formatStatus(status.card_status) : "Not connected";
  const payoutState = status?.payouts_enabled ? "Active" : status?.connected ? formatStatus(status.payout_status) : "Not connected";
  const requirements = status?.connected ? status.requirements_due ?? 0 : null;

  return <section className="glass-panel overflow-hidden rounded-[24px]">
    <div className="border-b border-[#e8e9f2] bg-gradient-to-br from-[#f7f7ff] via-white to-[#f4f8ff] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#635bff] text-white shadow-[0_10px_24px_-12px_#635bff]"><CreditCard className="size-5" /></span><div><p className="text-[10px] font-semibold tracking-[0.16em] text-[#6b6de2] uppercase">Seller wallet</p><h2 className="mt-0.5 text-lg font-semibold">Payments dashboard</h2></div></div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${status?.ready ? "bg-emerald-100 text-emerald-700" : status?.connected ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{status?.ready ? <CheckCircle2 className="size-3" /> : status?.connected ? <AlertCircle className="size-3" /> : <ShieldCheck className="size-3" />}{status?.ready ? "Ready" : status?.connected ? "Action needed" : "Not connected"}</span>
      </div>
      {!loading && <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{status?.ready ? "Your listings can accept secure test payments. Stripe handles checkout and sends your payout after the marketplace fee." : status?.connected ? requirements ? `Complete ${requirements} remaining Stripe requirement${requirements === 1 ? "" : "s"} to enable Buy Now on your listings.` : "Stripe is reviewing your account. Its status will update automatically." : "Connect a Stripe sandbox account to enable Buy Now and seller payouts."}</p>}
    </div>

    <div className="p-6">
      {loading ? <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Checking Stripe status…</div> : <>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusTile icon={<CreditCard className="size-4" />} label="Card payments" value={paymentState} active={Boolean(status?.charges_enabled)} />
          <StatusTile icon={<Landmark className="size-4" />} label="Payouts" value={payoutState} active={Boolean(status?.payouts_enabled)} />
          <StatusTile icon={<ShieldCheck className="size-4" />} label="Requirements" value={requirements === null ? "—" : requirements === 0 ? "Complete" : `${requirements} remaining`} active={requirements === 0 && Boolean(status?.connected)} />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#e5e7f0] bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0f1f7] text-[#62697b]"><AtSign className="size-4" /></span><div className="min-w-0"><p className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">Stripe account</p><p className="truncate text-sm font-medium text-[#30364a]">{status?.email || "No account connected"}</p></div></div>
          <span className="w-fit rounded-full border border-[#dedff0] bg-[#f8f8ff] px-2.5 py-1 text-[10px] font-semibold text-[#6768c9]">Test mode</span>
        </div>

        <form action={status?.ready ? "/api/stripe/dashboard?redirect=1" : "/api/stripe/connect?redirect=1"} method="post" onSubmit={() => { setStarting(true); setError(""); }}><button type="submit" disabled={starting} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] text-sm font-semibold text-white shadow-[0_12px_25px_-14px_#635bff] transition hover:bg-[#5149e8] disabled:opacity-60">{starting ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}{starting ? "Opening Stripe…" : status?.ready ? "Open Stripe dashboard" : status?.connected ? "Continue Stripe setup" : "Connect with Stripe"}</button></form>
      </>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
      <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">Sandbox only · No real money is moved</p>
    </div>
  </section>;
}

function StatusTile({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active: boolean }) {
  return <div className="rounded-2xl border border-[#e5e7f0] bg-white/70 p-4"><div className={`flex size-8 items-center justify-center rounded-lg ${active ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{icon}</div><p className="mt-3 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">{label}</p><p className={`mt-1 text-sm font-semibold ${active ? "text-emerald-700" : "text-[#555d70]"}`}>{value}</p></div>;
}

function formatStatus(status?: string) {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`The server returned an empty response (HTTP ${response.status}). Restart the development server and try again.`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`The server returned an invalid response (HTTP ${response.status}). Restart the development server and try again.`);
  }
}
