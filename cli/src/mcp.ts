import { loadToken } from "./auth.js";

// Calls an MCP verb via the HTTP JSON-RPC surface. Unwraps the
// `result.content[0].text` shape that MCP wraps tool responses in so callers
// see the raw JSON their verb actually returned.
export async function callVerb(
  name: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const token = await loadToken();
  if (!token) throw new Error("not logged in — run: whatelz login");

  const res = await fetch(`${token.origin}/api/mcp/whatelz`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`mcp call failed (${res.status}): ${await res.text()}`);
  }

  const body = (await res.json()) as {
    result?: { content?: Array<{ text?: string }> };
    error?: { code?: number; message?: string };
  };

  if (body.error) throw new Error(`mcp error: ${JSON.stringify(body.error)}`);

  const text = body.result?.content?.[0]?.text;
  if (typeof text === "string") {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return body.result;
}
