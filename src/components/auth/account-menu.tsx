"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, LogOut, MessageCircle, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { DataResponse, ProfileRecord } from "@/lib/api-types";

type AccountSummary = { email: string; name: string };

export function AccountMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  const loadProfile = useCallback(async (email: string) => {
    const fallbackName = email.split("@")[0];
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      const body = await response.json() as DataResponse<ProfileRecord>;
      if (!response.ok || !("data" in body)) throw new Error("Profile unavailable");
      const name = `${body.data.first_name} ${body.data.last_name}`.trim() || body.data.display_name || fallbackName;
      setAccount({ email: body.data.email || email, name });
    } catch {
      setAccount({ email, name: fallbackName });
    }
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email;
      if (email) void loadProfile(email);
      else setAccount(null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email;
      if (email) window.setTimeout(() => void loadProfile(email), 0);
      else setAccount(null);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (loading) {
    return <span aria-label="Loading account" className="size-10 animate-pulse rounded-xl bg-[#e9ebf3]" />;
  }

  if (!account) {
    return <Link href="/auth/login" className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#252d3c]">Sign in</Link>;
  }

  const initial = account.name.charAt(0).toUpperCase() || account.email.charAt(0).toUpperCase();
  const displayName = account.name || account.email.split("@")[0];

  async function signOut() {
    setSigningOut(true);
    await createBrowserSupabaseClient().auth.signOut();
    setAccount(null);
    setOpen(false);
    setSigningOut(false);
    router.replace("/");
    router.refresh();
  }

  return <div ref={menuRef} className="relative">
    <button type="button" onClick={() => setOpen((current) => !current)} aria-label={`Open account menu for ${displayName}`} aria-haspopup="menu" aria-expanded={open} className="flex h-10 items-center gap-2 rounded-xl border border-[#e3e6ef] bg-white/75 p-1 pr-1 text-sm font-semibold text-[#30364a] transition hover:border-[#cfd3e3] hover:bg-white md:pr-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#5b5cf0] to-[#22a9e8] text-xs font-semibold text-white shadow-[0_8px_20px_-10px_#5b5cf0]">{initial}</span>
      <span className="hidden max-w-36 truncate md:inline">{displayName}</span>
    </button>

    {open && <div role="menu" aria-label="Account menu" className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_24px_70px_-24px_rgba(31,38,70,0.38)] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-[#e8eaf1] p-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#5b5cf0] to-[#22a9e8] text-sm font-semibold text-white">{initial}</span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#25293a]">{account.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{account.email}</p></div>
      </div>

      <nav className="py-1">
        <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#3f4658] transition hover:bg-[#f4f5fa]"><span className="grid size-9 place-items-center rounded-lg bg-[#eef0ff] text-[#5b5cf0]"><UserRound className="size-[17px]" /></span><span className="flex-1">Profile</span><ChevronRight className="size-4 text-[#a0a5b5] transition group-hover:translate-x-0.5" /></Link>
        <Link role="menuitem" href="/messages" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#3f4658] transition hover:bg-[#f4f5fa]"><span className="grid size-9 place-items-center rounded-lg bg-[#eef8fc] text-[#1689b8]"><MessageCircle className="size-[17px]" /></span><span className="flex-1">Messages</span><ChevronRight className="size-4 text-[#a0a5b5] transition group-hover:translate-x-0.5" /></Link>
      </nav>

      <div className="border-t border-[#e8eaf1] pt-1">
        <button role="menuitem" type="button" onClick={() => void signOut()} disabled={signingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#a33b47] transition hover:bg-red-50 disabled:opacity-60"><span className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-600"><LogOut className={`size-[17px] ${signingOut ? "animate-pulse" : ""}`} /></span>{signingOut ? "Signing out…" : "Sign out"}</button>
      </div>
    </div>}
  </div>;
}
