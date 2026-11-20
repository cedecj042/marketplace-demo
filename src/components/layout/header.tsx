import Link from "next/link";
import { Orbit } from "lucide-react";
import { AccountMenu } from "@/components/auth/account-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NotificationCenter } from "@/components/notifications/notification-center";

export function Header() {
  return <header className="sticky top-0 z-50 flex h-[72px] items-center gap-2 border-b border-white/60 bg-white/75 px-4 backdrop-blur-2xl sm:px-7">
    <MobileMenu />
    <Link href="/" aria-label="Marketplace home" className="flex items-center gap-3">
      <span className="hidden size-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#5b5cf0] to-[#22a9e8] text-white shadow-[0_10px_25px_-10px_#5b5cf0] sm:grid"><Orbit className="size-5" /></span>
      <span className="hidden text-lg font-semibold tracking-[-0.02em] text-[#202337] min-[390px]:inline">Marketplace</span>
    </Link>
    <div className="ml-auto flex items-center gap-2">
      <NotificationCenter />
      <AccountMenu />
    </div>
  </header>;
}
