import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { loadTeamView, type TeamView } from "@/lib/team/server";
import { TeamTree } from "@/components/team/TeamTree";

export const metadata: Metadata = {
  title: "My team",
  robots: { index: false, follow: false },
};

export default async function MyTeamPage() {
  if (!(await auth()).userId) redirect("/sign-in?redirect_url=/team");
  let view: TeamView | null;
  try {
    view = await loadTeamView();
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">My team</h1>
        <p className="mt-4 text-zinc-500">
          Team information is temporarily unavailable.
        </p>
        <Link href="/" className="mt-6 inline-block underline">
          Back to member home
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <Link href="/" className="text-sm underline">
        Back to member home
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">My team</h1>
        <p className="mt-3 text-zinc-500">
          Your sponsor relationships and team connections.
        </p>
      </header>
      {view ? (
        <TeamTree
          people={view.people}
          focusId={view.focusId}
          canSeeAll={view.canSeeAll}
        />
      ) : (
        <p className="rounded-xl border border-zinc-200 p-6 text-zinc-500">
          Your account has not been linked to a team person yet. Your team
          administrator can verify and link it.
        </p>
      )}
    </main>
  );
}
