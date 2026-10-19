import "server-only";
import { dailyOwner } from "./server";
import { emdeeConnection } from "./connections";
import { randomUUID } from "node:crypto";
import { briefPath, type Brief, type BriefKind } from "./model";

type Envelope = {
  content?: string;
  doc_content_hash: string;
  sections: { heading: string; content_hash: string }[];
  error?: string;
};
async function call<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const connection = await emdeeConnection(await dailyOwner());
  if (!connection?.parentPath)
    throw new Error("Connect EMDEE before saving a brief.");
  const origin = new URL(process.env.EMDEE_ORIGIN || "https://emdee.tech");
  if (origin.protocol !== "https:")
    throw new Error("EMDEE requires a secure connection.");
  const res = await fetch(new URL("/api/mcp", origin), {
    method: "POST",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${connection.token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: randomUUID(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  if (!res.ok)
    throw new Error("EMDEE is unavailable or its connection needs renewing.");
  const raw = await res.text();
  const rpc = JSON.parse(
    res.headers.get("content-type")?.includes("text/event-stream")
      ? raw
          .split(/\r?\n/)
          .find((l) => l.startsWith("data:"))!
          .slice(5)
      : raw,
  );
  if (rpc.error || rpc.result?.isError)
    throw new Error(
      "EMDEE could not complete this request. Your text has been kept in the editor.",
    );
  const result = JSON.parse(
    rpc.result.content.find((c: { type: string }) => c.type === "text").text,
  );
  if (result.error) {
    if (result.error === "not_found" || result.error === "no_such_doc")
      throw new MissingDocument();
    throw new Error(
      "EMDEE rejected the change. Reload to check the latest document before saving.",
    );
  }
  return result as T;
}
class MissingDocument extends Error {}
async function read(path: string): Promise<Envelope | null> {
  // Discovery distinguishes a missing file from a failed/unauthorized read.
  const docs = await call<{ path: string }[]>("list_docs", {
    prefix: path,
    limit: 2,
    format: "compact",
  });
  if (!Array.isArray(docs))
    throw new Error("EMDEE returned an invalid document list.");
  if (!docs.some((d) => d.path === path)) return null;
  return call<Envelope>("get_doc", { path, full: true });
}
export async function loadBrief(day: string, kind: BriefKind): Promise<Brief> {
  const connection = await emdeeConnection(await dailyOwner());
  if (!connection?.parentPath)
    throw new Error("Connect EMDEE before saving a brief.");
  const parent = connection.parentPath;
  const path = briefPath(parent, day, kind);
  const doc = await read(path);
  const section = doc?.sections.find((s) => s.heading === "Notes");
  // Keep the full Notes body, including nested H3 headings. Only H2 splits it.
  const body =
    doc?.content
      ?.split(/^## Notes\s*$/m)[1]
      ?.split(/^## /m)[0]
      ?.trim() ?? "";
  return { body, path, hash: section?.content_hash ?? "", exists: !!doc };
}
export async function saveBrief(
  day: string,
  kind: BriefKind,
  body: string,
  hash: string,
): Promise<Brief> {
  const current = await loadBrief(day, kind);
  if (current.hash !== hash)
    throw new Error(
      "This brief changed in EMDEE. Reload before saving; keep a copy of your edits.",
    );
  if (current.exists) {
    await call("patch_section", {
      path: current.path,
      heading: "Notes",
      body,
      expected_content_hash: hash,
      no_auto_hash: true,
      author: "whatelz-daily",
    });
  } else {
    const connection = await emdeeConnection(await dailyOwner());
    if (!connection?.parentPath)
      throw new Error("Connect EMDEE before saving a brief.");
    const parent = connection.parentPath;
    const doc = await call<Envelope>("get_doc", { path: parent, full: false });
    await call("create_child", {
      parent_path: parent,
      child_path: current.path,
      title: `DAILY — ${day} — ${kind.toUpperCase()}`,
      summary: `${kind === "morning" ? "Morning preparation" : "Evening closeout"} for ${day}, Asia/Singapore.`,
      body,
      expected_parent_content_hash: doc.doc_content_hash,
      no_auto_hash: true,
      author: "whatelz-daily",
    });
  }
  const saved = await loadBrief(day, kind);
  if (saved.body !== body.trim())
    throw new Error(
      "The EMDEE write needs verification. Reload before retrying.",
    );
  return saved;
}
