import Link from "next/link";
import { Car, ChevronRight, Home, LayoutGrid, Plus, Shirt, Smartphone, Sparkles, Tag, ToyBrick } from "lucide-react";
import { SearchForm } from "@/components/marketplace/search-form";
import { categories } from "@/lib/marketplace-data";

const icons = { vehicles: Car, "property-rentals": Home, apparel: Shirt, electronics: Smartphone, "home-garden": Home, hobbies: ToyBrick, classifieds: Tag };

export function Sidebar() {
  return <aside className="hidden w-[300px] shrink-0 lg:block"><div className="glass-panel sticky top-[92px] m-5 mr-0 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[22px] p-4">
    <div className="mb-5 flex items-start justify-between px-1"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-[#7c8194] uppercase">Discover</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Marketplace</h2></div><span className="grid size-9 place-items-center rounded-xl bg-[#eeefff] text-[#5b5cf0]"><Sparkles className="size-4" /></span></div>
    <div className="mb-4"><SearchForm compact /></div>
    <nav className="space-y-1">
      <Link href="/" className="flex items-center gap-3 rounded-xl bg-[#111827] p-2 font-medium text-white shadow-[0_12px_24px_-16px_#111827]"><span className="grid size-9 place-items-center rounded-lg bg-white/10"><LayoutGrid className="size-[18px]" /></span>Browse all</Link>
      <Link href="/create" className="mb-4 mt-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe2ff] bg-[#f0f0ff] text-sm font-semibold text-[#5051d9] transition hover:border-[#bfc0ff] hover:bg-[#e9e9ff]"><Plus className="size-4" /> Create listing</Link>
      <div className="border-t border-[#eceef3] pt-4"><div className="mb-2 flex items-center justify-between px-2"><h3 className="text-xs font-semibold tracking-[0.12em] text-[#7c8194] uppercase">Categories</h3><ChevronRight className="size-4 text-[#a2a8b7]" /></div>
        {categories.map(({ slug, label }) => { const Icon = icons[slug as keyof typeof icons]; return <Link key={slug} href={`/category/${slug}`} className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium text-[#4b5565] transition hover:bg-white hover:text-[#22243a]"><span className="grid size-9 place-items-center rounded-lg bg-[#f1f3f7] text-[#6b7280]"><Icon className="size-[17px]" /></span>{label}</Link>; })}
      </div>
    </nav>
  </div></aside>;
}
