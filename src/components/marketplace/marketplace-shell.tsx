import { Sidebar } from "@/components/layout/sidebar";

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[calc(100vh-4.5rem)]"><Sidebar /><main className="min-w-0 flex-1 p-4 sm:p-7 lg:p-10 xl:px-12">{children}</main></div>;
}
