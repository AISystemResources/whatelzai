import "server-only";
import { randomUUID } from "node:crypto";
import type { EmdeeConnection } from "./connections";
export type Envelope = {
  content?: string;
  doc_content_hash: string;
  sections: { heading: string; content_hash: string }[];
  error?: string;
};
export async function emdeeCall<T>(
  connection: EmdeeConnection,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!connection.parentPath || connection.expiresAt <= Date.now())
    throw new Error("Reconnect EMDEE before using Daily.");
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
export async function readEmdee(
  connection: EmdeeConnection,
  path: string,
): Promise<Envelope | null> {
  // Discovery distinguishes a missing file from a failed/unauthorized read.
  const docs = await emdeeCall<{ path: string }[]>(connection, "list_docs", {
    prefix: path,
    limit: 2,
    format: "compact",
  });
  if (!Array.isArray(docs))
    throw new Error("EMDEE returned an invalid document list.");
  if (!docs.some((d) => d.path === path)) return null;
  return emdeeCall<Envelope>(connection, "get_doc", { path, full: true });
}
