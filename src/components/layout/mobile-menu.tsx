"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bookmark, LayoutGrid, Menu, MessageCircle, Package, Plus, UserRound, X } from "lucide-react";
import { SearchForm } from "@/components/marketplace/search-form";
import { categories } from "@/lib/marketplace-data";

const accountLinks = [
  { href: "/", label: "Browse Marketplace", icon: LayoutGrid },
  { href: "/create/item", label: "Create listing", icon: Plus },
  { href: "/my-listings", label: "My listings", icon: Package },
  { href: "/saved", label: "Saved listings", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation menu" aria-expanded={open} aria-controls="mobile-navigation" className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e3e6ef] bg-white/70 text-[#475569] transition hover:bg-white lg:hidden"><Menu className="size-[19px]" /></button>
    {open && createPortal(<div className="fixed inset-0 z-[100] lg:hidden">
      <button type="button" aria-label="Close navigation menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#111827]/35 backdrop-blur-sm" />
      <aside id="mobile-navigation" aria-label="Mobile navigation" className="relative h-dvh w-[min(88vw,360px)] overflow-y-auto border-r border-white/70 bg-[#f8f9fd] p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Navigation</p><h2 className="mt-1 text-xl font-semibold">Marketplace</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-xl border bg-white text-[#475569]"><X className="size-5" /></button></div>
        <SearchForm compact />
        <nav className="mt-5 space-y-1">
          {accountLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-2.5 text-sm font-medium text-[#4b5565] transition hover:bg-white hover:text-[#22243a]"><span className="grid size-9 place-items-center rounded-lg bg-[#eef0f5]"><Icon className="size-[17px]" /></span>{label}</Link>)}
        </nav>
        <div className="mt-5 border-t border-[#e5e8ef] pt-5"><h3 className="mb-2 px-2 text-xs font-semibold tracking-[0.12em] text-[#7c8194] uppercase">Categories</h3>{categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[#4b5565] transition hover:bg-white hover:text-[#22243a]">{category.label}</Link>)}</div>
      </aside>
    </div>, document.body)}
  </>;
}
