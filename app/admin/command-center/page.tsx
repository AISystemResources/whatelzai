import { adminUrl } from "@/lib/admin-url";
import type { Metadata } from "next";
import { getSelfMetrics } from "@/lib/cockpit-self";
import {
  fetchRemoteWidgets,
  type OwnerMetrics,
  type WidgetState,
} from "@/lib/cockpit";
import { ProductWidget } from "./_components/ProductWidget";

export const metadata: Metadata = { title: "Overview — Admin" };
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
          Overview
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-600">
          Your AI business at a glance: whatelz.ai and EMDEE. Metrics refresh on
          every page load. Each product shows its connection status when data is
          unavailable.
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Loaded {now.toLocaleString("en-SG")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProductWidget
          product="whatelz"
          label="whatelz.ai"
          state={selfState}
          adminHref={adminUrl()}
        />
        <ProductWidget
          product="emdee"
          label="EMDEE"
          state={remoteWidgets.emdee}
          adminHref="https://emdee.tech/admin"
        />
      </div>
    </div>
  );
}
