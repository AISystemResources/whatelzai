import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { ensureUserRow } from "@/lib/users";
import { loadBriefing, briefingLeads } from "@/lib/fcos/server";
import { BriefingEditor } from "@/components/fcos/BriefingEditor";
import { MemberNav } from "@/components/culture/MemberNav";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private note · fcOS",
  robots: { index: false, follow: false },
};
export default async function BriefingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  if (!(await ensureUserRow())) redirect("/sign-in");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const note = await loadBriefing(id);
  if (!note) notFound();
  const q = await searchParams;
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
      <MemberNav current="/briefings" />
      <Link href="/briefings" className="block text-sm underline">
        ← HQH & HHH
      </Link>
      <h1 className="text-3xl font-semibold">{note.title}</h1>
      {q.saved === "1" && (
        <p role="status" className="text-green-700">
          Note saved · private to you.
        </p>
      )}
      <BriefingEditor
        key={note.revision}
        note={note}
        leads={await briefingLeads()}
      />
    </main>
  );
}
