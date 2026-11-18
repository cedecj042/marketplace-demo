"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/?search=${encodeURIComponent(query)}` : "/");
  }
  return <form onSubmit={submit} role="search" className="relative w-full"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a92a3]" /><input value={value} onChange={(event) => setValue(event.target.value)} aria-label="Search Marketplace" placeholder="Search Marketplace" className={`w-full rounded-xl border border-[#e3e6ef] bg-white/65 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#9ba2b1] focus:border-[#7778ff] focus:bg-white focus:ring-4 focus:ring-[#7778ff]/10 ${compact ? "h-10" : "h-11"}`} /></form>;
}
