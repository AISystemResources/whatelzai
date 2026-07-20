"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Small inline "clear filter" link. Lives outside KeywordCards so the narrative
// header on /testimonials can invoke it too without duplicating URL logic.
export function ClearFilterLink() {
  const router = useRouter();
  const params = useSearchParams();
  function clear() {
    const next = new URLSearchParams(params);
    next.delete("filter");
    const qs = next.toString();
    router.push(`/testimonials${qs ? `?${qs}` : ""}`, { scroll: false });
  }
  return (
    <button
      type="button"
      onClick={clear}
      className="font-mono text-xs uppercase tracking-widest text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
    >
      Clear filter
    </button>
  );
}
