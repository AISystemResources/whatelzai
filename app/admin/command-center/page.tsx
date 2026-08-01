import type { Metadata } from "next";
import { getSelfMetrics } from "@/lib/cockpit-self";
import {
  fetchRemoteWidgets,
  type OwnerMetrics,
  type WidgetState,
} from "@/lib/cockpit";
import { ProductWidget } from "./_components/ProductWidget";

export const metadata: Metadata = { title: "Command Center — Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommandCenterPage() {
  // Fetch everything in parallel. Each widget renders independently so a
  // slow / down remote doesn't hold up the others.
  const [selfMetrics, remoteWidgets] = await Promise.all([
    getSelfMetrics().catch(
      (err): WidgetState<OwnerMetrics> => ({
        status: "error",
        reason: (err as Error).message,
      }),
    ),
    fetchRemoteWidgets(),
  ]);

  const selfState: WidgetState<OwnerMetrics> =
    "product" in selfMetrics
      ? {
          status: "available",
          data: selfMetrics,
          fetched_at: new Date().toISOString(),
        }
      : selfMetrics;

  const now = new Date();

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-200 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Command Center
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-600">
          Cross-product health for whatelz.ai, EMDEE, and DoubleLead. Read-only
          view fed by each product&apos;s internal owner-metrics endpoint. Fresh
          on every page load; individual widgets degrade gracefully if a remote
          endpoint is unreachable.
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Loaded {now.toLocaleString("en-SG")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProductWidget
          product="whatelz"
          label="whatelz.ai"
          state={selfState}
          adminHref="/admin"
        />
        <ProductWidget
          product="emdee"
          label="EMDEE"
          state={remoteWidgets.emdee}
          adminHref="https://emdee.tech/admin"
        />
        <ProductWidget
          product="doublelead"
          label="DoubleLead"
          state={remoteWidgets.doublelead}
          adminHref="https://doublelead.io/admin"
        />
      </div>

      <footer className="border-t border-zinc-100 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Phase 1 · Remote widgets pending SPRINT-XXX in EMDEE + DoubleLead
          repos
        </p>
      </footer>
    </div>
  );
}
