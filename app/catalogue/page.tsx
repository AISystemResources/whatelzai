import { MemberNav } from "@/components/culture/MemberNav";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { loadCatalogue } from "@/lib/catalogue/server";
import { CatalogueBrowser } from "@/components/catalogue/CatalogueBrowser";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Product catalogue",
  robots: { index: false, follow: false },
};
export default async function CataloguePage() {
  if (!(await ensureUserRow())) redirect("/sign-in?redirect_url=/catalogue");
  let catalogue;
  try {
    catalogue = await loadCatalogue();
  } catch {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <MemberNav current="/catalogue" />
        <h1 className="mt-8 text-3xl font-semibold">Product catalogue</h1>
        <p className="mt-4">
          The catalogue is temporarily unavailable. Please try again shortly.
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8">
      <MemberNav current="/catalogue" />
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Network Marketing · Product reference
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Know the products.
          <br />
          Understand the numbers.
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-zinc-600">
          Explore Malaysia and Singapore products, ABO and retail prices, and
          published PV/BV. A reference for customer conversations and future
          planning.
        </p>
      </header>
      <CatalogueBrowser {...catalogue} />
    </main>
  );
}
