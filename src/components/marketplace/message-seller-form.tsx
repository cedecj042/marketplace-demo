"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function MessageSellerForm({ listingId, sellerEmail, title }: { listingId: string; sellerEmail: string; title: string }) {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setFields({});
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listingId, seller_email: sellerEmail, buyer_email: form.get("buyerEmail"), message: form.get("message") }) });
      const payload = await response.json() as { data?: unknown; error?: { message?: string; fields?: Record<string, string> } };
      if (!response.ok || !payload.data) { setFields(payload.error?.fields ?? {}); throw new Error(payload.error?.message ?? "Message could not be sent."); }
      setSuccess(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Message could not be sent."); }
    finally { setPending(false); }
  }
  if (success) return <div role="status" className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 font-medium text-emerald-700"><CheckCircle2 className="size-5" />Message sent to the seller.</div>;
  return <form onSubmit={submit} className="mt-6 space-y-3"><h2 className="font-bold">Message seller</h2>
    <label className="block text-sm font-medium">Your email<Input name="buyerEmail" type="email" placeholder="you@example.com" className="mt-1 h-10" required aria-invalid={!!fields.buyer_email} /></label>{fields.buyer_email && <p className="text-xs text-destructive">{fields.buyer_email}</p>}
    <label className="block text-sm font-medium">Message<Textarea name="message" defaultValue={`Hi, is ${title} still available?`} className="mt-1 min-h-24" required maxLength={2000} aria-invalid={!!fields.message} /></label>{fields.message && <p className="text-xs text-destructive">{fields.message}</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-destructive">{error}</p>}
    <button disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] font-semibold text-white shadow-[0_14px_25px_-16px_#111827] transition hover:bg-[#252d3c] disabled:opacity-60">{pending ? <><LoaderCircle className="size-5 animate-spin" />Sending…</> : <><MessageCircle className="size-5" />Send message</>}</button>
  </form>;
}
