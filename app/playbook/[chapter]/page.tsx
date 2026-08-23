import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { getChapterBySlug } from "@/lib/playbook-chapters";
import { hasActiveEntitlement } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ensureSessionId } from "@/lib/wz-session";
import { hasRecentSessionStart, logEvent } from "@/lib/event-log";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Playbook",
  robots: { index: false, follow: false },
};

async function latestArchetypeSlug(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("quiz_attempts")
    .select("archetype_key")
    .eq("clerk_user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.archetype_key as string | undefined) ?? null;
}

export default async function PlaybookChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterSlug } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=/playbook/${chapterSlug}`);
  }
  const active = await hasActiveEntitlement(userId, "playbook");
  if (!active) {
    redirect("/playbook?from=locked");
  }

  const chapter = await getChapterBySlug(chapterSlug);
  const sessionId = await ensureSessionId();

  const referer = (await headers()).get("referer") ?? null;
  const sameOriginReferer = (() => {
    if (!referer) return null;
    try {
      const u = new URL(referer);
      const site = new URL(
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://whatelz.ai",
      );
      return u.origin === site.origin ? u.pathname : null;
    } catch {
      return null;
    }
  })();

  const archetype = await latestArchetypeSlug(userId);

  if (!(await hasRecentSessionStart(sessionId))) {
    await logEvent({
      event_type: "playbook.session_start",
      session_id: sessionId,
      user_id: userId,
      source: "server",
      payload: {
        entry_path: `/playbook/${chapterSlug}`,
        referrer: sameOriginReferer,
        archetype_slug: archetype,
      },
    });
  }

  if (chapter) {
    await logEvent({
      event_type: "playbook.chapter_viewed",
      session_id: sessionId,
      user_id: userId,
      source: "server",
      payload: {
        chapter_slug: chapter.slug,
        chapter_part: chapter.part,
        chapter_ordinal: chapter.ordinal,
      },
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {chapter ? (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            Part {chapter.part} · Chapter {chapter.ordinal}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">
            {chapter.title}
          </h1>
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
            <p>Chapter content coming soon.</p>
            <p className="mt-2">
              You have lifetime access — updates land automatically as chapters
              publish.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold text-zinc-900">
            That chapter isn&apos;t published yet.
          </h1>
          <p className="mt-4 text-zinc-600">
            <Link href="/account/playbook" className="underline">
              See what&apos;s available →
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
