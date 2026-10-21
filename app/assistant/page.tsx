import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureUserRow } from "@/lib/users";
import { MemberNav } from "@/components/culture/MemberNav";
import { memberWorkspace } from "@/lib/member-ai/server";
import { money } from "@/lib/member-ai/model";
import { newConversation } from "./actions";
import { Chat } from "./Chat";
import { CompleteTask } from "./CompleteTask";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your assistant — Whatelzai",
  robots: { index: false, follow: false },
};
export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>;
}) {
  if (!(await ensureUserRow())) redirect("/sign-in");
  const query = await searchParams;
  const chat = query.chat ? z.uuid().safeParse(query.chat) : null;
  if (chat && !chat.success) redirect("/assistant");
  let workspace;
  try {
    workspace = await memberWorkspace(chat?.success ? chat.data : undefined);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <MemberNav current="/assistant" />
        <h1 className="mt-10 text-3xl font-semibold">Your assistant</h1>
        <p className="mt-4">
          This pilot is invite only. Ask Edmund to activate your account, or
          return later if the workspace is temporarily unavailable.
        </p>
      </main>
    );
  }
  const used = Number(workspace.cycle?.spent_micro ?? 0);
  const held = Number(workspace.cycle?.reserved_micro ?? 0);
  const allowance = Number(
    workspace.cycle?.allowance_micro ?? workspace.allowance,
  );
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 text-zinc-900 sm:px-6 sm:py-10">
      <MemberNav current="/assistant" />
      <header className="my-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            A space to move forward
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Your assistant<span className="text-yellow-500">.</span>
          </h1>
        </div>
        <form action={newConversation}>
          <button className="min-h-11 rounded-xl bg-yellow-300 px-5 font-semibold">
            + New conversation
          </button>
        </form>
      </header>
      <p className="mb-5 rounded-xl bg-yellow-50 px-4 py-3 text-sm lg:hidden">
        {money(Math.max(0, allowance - used - held))} remaining this month ·{" "}
        <a href="#assistant-details" className="underline">
          Usage & conversations
        </a>
      </p>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside
          id="assistant-details"
          className="order-2 min-w-0 space-y-5 lg:order-1"
        >
          <section className="rounded-2xl bg-zinc-950 p-5 text-white">
            <h2 className="text-sm font-medium">Your monthly AI allowance</h2>
            <p className="mt-3 text-2xl font-semibold">
              {money(Math.max(0, allowance - used - held))}{" "}
              <span className="text-sm font-normal text-zinc-400">left</span>
            </p>
            <p className="mt-2 text-xs text-zinc-300">
              {money(used, 6)} used · {money(held, 6)} reserved
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              {money(allowance)} monthly. Renews on the 1st, Singapore time.
              Edmund can grant a full reset.
            </p>
            <p className="mt-3 text-xs text-yellow-300">{workspace.model}</p>
          </section>
          <details className="rounded-2xl border p-4" open>
            <summary className="cursor-pointer font-medium">
              Conversations
            </summary>
            <nav
              className="mt-3 max-h-48 space-y-1 overflow-y-auto"
              aria-label="Your conversations"
            >
              {workspace.chats.map((c) => (
                <Link
                  key={c.id}
                  href={`/assistant?chat=${c.id}`}
                  aria-current={
                    c.id === workspace.selected ? "page" : undefined
                  }
                  className={`block truncate rounded-lg p-2 text-sm ${c.id === workspace.selected ? "bg-yellow-100" : "hover:bg-zinc-100"}`}
                >
                  {c.title}
                </Link>
              ))}
            </nav>
          </details>
          <section className="rounded-2xl border p-4">
            <h2 className="font-medium">Your commitments</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Only you can accept or complete these.
            </p>
            <ul className="mt-3 space-y-4">
              {workspace.tasks.map((t) => (
                <li key={t.id} className="border-b pb-3 text-sm">
                  <p>{t.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.due_on} · {t.status}
                  </p>
                  {t.status === "open" && (
                    <CompleteTask id={t.id} revision={t.revision} />
                  )}
                </li>
              ))}
            </ul>
            {!workspace.tasks.length && (
              <p className="mt-3 text-sm text-zinc-500">
                No active commitments yet.
              </p>
            )}
          </section>
          <section className="rounded-2xl border p-4">
            <h2 className="font-medium">Your EMDEE vault</h2>
            <p className="mt-2 text-sm text-zinc-600">
              {workspace.vault?.connected
                ? `Connected: ${workspace.vault.handle ?? workspace.vault.id}`
                : "Not connected yet. Vault access requires your own verified EMDEE connection."}
            </p>
            <Link
              href="/assistant/connections"
              className="mt-3 inline-block text-sm underline"
            >
              Manage connection →
            </Link>
          </section>
        </aside>
        <section className="order-1 min-w-0 lg:order-2">
          {workspace.selected ? (
            <Chat
              key={workspace.selected}
              messages={workspace.messages}
              conversationId={workspace.selected}
              enabled={workspace.enabled}
            />
          ) : (
            <div className="rounded-3xl bg-yellow-50 p-8">
              <h2 className="text-2xl font-semibold">
                What have you been putting off?
              </h2>
              <p className="mt-3 text-zinc-600">
                Start a conversation. Find one small step. Make it yours.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
