import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureUserRow } from "@/lib/users";
import { MemberNav } from "@/components/culture/MemberNav";
import { memberWorkspace } from "@/lib/member-ai/server";
import { money } from "@/lib/member-ai/model";
import { ChatMenu } from "./ChatMenu";
import { Chat } from "./Chat";
import { ChatViewport } from "./ChatViewport";
import { CompleteTask } from "./CompleteTask";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Chat · fcOS",
  robots: { index: false, follow: false },
};
export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{
    chat?: string;
    prompt?: string;
    new?: string;
    draft?: string;
  }>;
}) {
  if (!(await ensureUserRow())) redirect("/sign-in");
  const query = await searchParams;
  const chat = query.chat ? z.uuid().safeParse(query.chat) : null;
  if (chat && !chat.success) redirect("/assistant");
  let workspace;
  try {
    workspace = await memberWorkspace(
      chat?.success ? chat.data : undefined,
      query.new === "1",
    );
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <MemberNav current="/assistant" />
        <h1 className="mt-10 text-3xl font-semibold">fcOS Chat</h1>
        <p className="mt-4">
          Chat is available to activated members. Your workspace could not be
          loaded right now. Please refresh or ask Edmund to check your account.
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
    <ChatViewport>
      <MemberNav current="/assistant" compact />
      <ChatMenu>
        <aside className="space-y-6">
          <Link
            href="/assistant?new=1"
            className="block rounded-xl bg-yellow-300 px-4 py-3 text-center font-semibold"
          >
            + New chat
          </Link>
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
              {money(allowance)} this period. The normal US$5 monthly allowance
              renews on the 1st, Singapore time. Edmund can grant a full or half
              reset.
            </p>
            <p className="mt-3 text-xs text-yellow-300">{workspace.model}</p>
          </section>
          <section className="rounded-2xl border p-4">
            <h3 className="font-medium">Conversations</h3>
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
          </section>
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
            <h2 className="font-medium">Optional knowledge connection</h2>
            <p className="mt-2 text-sm text-zinc-600">
              {workspace.vault?.connected
                ? `Connected: ${workspace.vault.handle ?? workspace.vault.id}`
                : "fcOS works without EMDEE. Connect your own collection only if you want additional knowledge context."}
            </p>
            <Link
              href="/assistant/connections"
              className="mt-3 inline-block text-sm underline"
            >
              Manage connection →
            </Link>
          </section>
        </aside>
      </ChatMenu>
      <Chat
        key={
          workspace.selected ??
          (z.uuid().safeParse(query.draft).success ? query.draft : "blank")
        }
        messages={workspace.messages}
        conversationId={workspace.selected}
        enabled={workspace.enabled}
        name={workspace.name?.split(" ")[0] ?? ""}
        initialPrompt={
          query.prompt === "hqh"
            ? "Help me prepare an HQH (会前会). Ask which lead and event before drafting."
            : query.prompt === "hhh"
              ? "Help me write an HHH (会后会). Ask what happened and what I learned."
              : ""
        }
      />
    </ChatViewport>
  );
}
