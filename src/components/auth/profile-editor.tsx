"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, LoaderCircle, MapPin, Package, Save, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DataResponse, ProfileRecord } from "@/lib/api-types";
import { StripeConnectCard } from "@/components/payments/stripe-connect-card";

type ProfileForm = Pick<ProfileRecord, "first_name" | "last_name" | "phone" | "location" | "bio">;
const emptyProfile: ProfileForm = { first_name: "", last_name: "", phone: "", location: "", bio: "" };

function responseError(value: unknown, fallback: string) {
  if (typeof value === "object" && value !== null && "error" in value) {
    const error = (value as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string") return error.message;
  }
  return fallback;
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/profile", { cache: "no-store" }).then(async (response) => {
      const body: unknown = await response.json().catch(() => null);
      if (!active) return;
      if (!response.ok) throw new Error(responseError(body, "Your profile could not be loaded."));
      const record = (body as DataResponse<ProfileRecord>).data;
      setEmail(record.email);
      setProfile({ first_name: record.first_name, last_name: record.last_name, phone: record.phone, location: record.location, bio: record.bio });
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Your profile could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function update<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseError(body, "Your profile could not be saved."));
      const record = (body as DataResponse<ProfileRecord>).data;
      setProfile({ first_name: record.first_name, last_name: record.last_name, phone: record.phone, location: record.location, bio: record.bio });
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const initial = profile.first_name.trim().charAt(0).toUpperCase() || email.charAt(0).toUpperCase() || "U";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-7 sm:py-12">
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Your account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Profile settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Keep your marketplace identity and contact details up to date.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <div className="space-y-6">
          <section className="glass-panel rounded-[24px] p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-4 border-b border-[#e8eaf1] pb-6">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#5b5cf0] to-[#22a9e8] text-xl font-semibold text-white">{initial}</div>
            <div className="min-w-0"><h2 className="truncate text-lg font-semibold">{fullName || "Your profile"}</h2><p className="truncate text-sm text-muted-foreground">{email || "Loading account…"}</p></div>
          </div>

          {loading ? <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Loading profile…</div> : (
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">First name<Input value={profile.first_name} onChange={(event) => update("first_name", event.target.value)} className="mt-2 h-11" minLength={1} maxLength={80} autoComplete="given-name" required /></label>
                <label className="block text-sm font-medium">Last name<Input value={profile.last_name} onChange={(event) => update("last_name", event.target.value)} className="mt-2 h-11" minLength={1} maxLength={80} autoComplete="family-name" required /></label>
                <label className="block text-sm font-medium">Phone <span className="font-normal text-muted-foreground">(optional)</span><Input value={profile.phone} onChange={(event) => update("phone", event.target.value)} className="mt-2 h-11" maxLength={30} type="tel" autoComplete="tel" placeholder="+63 900 000 0000" /></label>
                <label className="block text-sm font-medium">Location<div className="relative mt-2"><MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={profile.location} onChange={(event) => update("location", event.target.value)} className="h-11 pl-10" maxLength={255} autoComplete="address-level2" placeholder="Palo Alto, CA" /></div></label>
                <label className="block text-sm font-medium sm:col-span-2">Email<Input value={email} className="mt-2 h-11 bg-[#f4f5f8] text-muted-foreground" type="email" readOnly aria-describedby="email-note" /><span id="email-note" className="mt-1.5 block text-xs text-muted-foreground">Managed by your Supabase sign-in account.</span></label>
              </div>
              <label className="block text-sm font-medium">About you <span className="font-normal text-muted-foreground">(optional)</span><Textarea value={profile.bio} onChange={(event) => update("bio", event.target.value)} className="mt-2 min-h-28 resize-y" maxLength={500} placeholder="A short introduction for buyers and sellers." /><span className="mt-1.5 block text-right text-xs text-muted-foreground">{profile.bio.length}/500</span></label>
              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              {saved && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Profile saved successfully.</p>}
              <button disabled={saving} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#252d3c] disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{saving ? "Saving…" : "Save changes"}</button>
            </form>
          )}
          </section>

          <StripeConnectCard />
        </div>

        <aside className="space-y-6">
          <section className="glass-panel rounded-[24px] p-3">
            <Link href="/my-listings" className="flex items-center gap-3 rounded-2xl p-3 text-sm font-semibold text-[#30364a] transition hover:bg-[#f4f5fa]"><span className="grid size-10 place-items-center rounded-xl bg-[#eef0ff] text-[#5b5cf0]"><Package className="size-5" /></span><span>My listings<span className="mt-0.5 block text-xs font-normal text-muted-foreground">Manage items you are selling</span></span></Link>
            <Link href="/saved" className="flex items-center gap-3 rounded-2xl p-3 text-sm font-semibold text-[#30364a] transition hover:bg-[#f4f5fa]"><span className="grid size-10 place-items-center rounded-xl bg-[#eef8fc] text-[#1689b8]"><Bookmark className="size-5" /></span><span>Saved listings<span className="mt-0.5 block text-xs font-normal text-muted-foreground">View your bookmarked items</span></span></Link>
          </section>
          <section className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><ShieldCheck className="size-4" />Private account data</div><p className="mt-2 text-xs leading-5 text-emerald-700">Only you can read or update this profile through database security policies.</p></section>
        </aside>
      </div>
    </main>
  );
}
