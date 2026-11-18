"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#f0f2f5] px-4"><div className="max-w-md rounded-2xl border bg-white p-10 text-center shadow-sm"><AlertTriangle className="mx-auto size-10 text-amber-500" /><h1 className="mt-4 text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-sm text-muted-foreground">Marketplace hit an unexpected problem. Your data is safe—try loading this view again.</p><button onClick={reset} className="mx-auto mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#1877f2] px-4 font-semibold text-white"><RotateCcw className="size-4" />Try again</button></div></main>;
}
