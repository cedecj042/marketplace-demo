import Link from "next/link";
import { Bell, Menu, MessageCircle, Orbit } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  return <header className="sticky top-0 z-50 flex h-[72px] items-center border-b border-white/60 bg-white/75 px-4 backdrop-blur-2xl sm:px-7">
    <Link href="/" aria-label="Marketplace home" className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#5b5cf0] to-[#22a9e8] text-white shadow-[0_10px_25px_-10px_#5b5cf0]"><Orbit className="size-5" /></span>
      <span className="text-lg font-semibold tracking-[-0.02em] text-[#202337]">Marketplace</span>
    </Link>
    <div className="ml-auto flex items-center gap-2">
      <button aria-label="Open menu" className="grid size-10 place-items-center rounded-xl border border-[#e3e6ef] bg-white/70 text-[#475569] transition hover:border-[#cfd3e3] hover:bg-white"><Menu className="size-[18px]" /></button>
      <button aria-label="Messages" className="hidden size-10 place-items-center rounded-xl border border-[#e3e6ef] bg-white/70 text-[#475569] transition hover:bg-white sm:grid"><MessageCircle className="size-[18px]" /></button>
      <button aria-label="Notifications" className="hidden size-10 place-items-center rounded-xl border border-[#e3e6ef] bg-white/70 text-[#475569] transition hover:bg-white sm:grid"><Bell className="size-[18px]" /></button>
      <Avatar className="size-10 ring-2 ring-white"><AvatarFallback className="bg-[#111827] text-xs font-semibold text-white">CM</AvatarFallback></Avatar>
    </div>
  </header>;
}
