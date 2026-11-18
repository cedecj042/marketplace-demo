import type { Metadata } from "next";
import Link from "next/link";
import { Car, Home, Package, Plus, Tag } from "lucide-react";

export const metadata: Metadata = { title: "Create listing" };

const listingTypes = [
  { title: "Item for sale", description: "Sell almost anything to people nearby.", href: "/create/item", icon: Package },
  { title: "Vehicle for sale", description: "List a car, motorcycle, or other vehicle.", href: "/create/item", icon: Car },
  { title: "Home for sale or rent", description: "Reach people looking for their next home.", href: "/create/item", icon: Home },
];

export default function CreatePage() {
  return <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-5xl px-4 py-14 sm:px-6">
    <div className="mb-10 text-center"><span className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#5b5cf0] to-[#22a9e8] text-white shadow-[0_16px_30px_-16px_#5b5cf0]"><Plus /></span><p className="text-[11px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Start selling</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Choose listing type</h1><p className="mt-3 text-sm text-muted-foreground">What would you like to list on Marketplace?</p></div>
    <div className="grid gap-5 md:grid-cols-3">{listingTypes.map(({ title, description, href, icon: Icon }) => <Link key={title} href={href} className="glass-panel group rounded-[22px] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c9caff] hover:shadow-[0_24px_55px_-35px_#5b5cf0]"><span className="mb-12 grid size-12 place-items-center rounded-[14px] bg-[#f0f1f6] text-[#606777] transition group-hover:bg-[#ededff] group-hover:text-[#5b5cf0]"><Icon className="size-5" /></span><h2 className="text-lg font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><span className="mt-7 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#5b5cf0] uppercase"><Tag className="size-3.5" /> Start listing</span></Link>)}</div>
  </main>;
}
