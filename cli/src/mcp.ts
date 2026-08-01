import { loadToken, currentProfile } from "./auth.js";

// Calls an MCP verb via the HTTP JSON-RPC surface. Unwraps the
// `result.content[0].text` shape that MCP wraps tool responses in so callers
// see the raw JSON their verb actually returned.
export async function callVerb(
  name: string,
  args: Record<string, unknown> = {},
  profile: string = currentProfile(),
): Promise<unknown> {
  const token = await loadToken(profile);
  if (!token)
    throw new Error(
      profile === "default"
        ? "not logged in — run: whatelz login"
        : `not logged in as profile "${profile}" — run: whatelz login --profile ${profile}`,
    );

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

// Raw JSON-RPC dispatch — used by the `whatelz mcp` stdio server to forward
// arbitrary methods (tools/list, initialize, etc.) to the HTTP MCP.
export async function rpcCall(
  method: string,
  params: unknown,
  profile: string = currentProfile(),
): Promise<unknown> {
  const token = await loadToken(profile);
  if (!token) throw new Error("not logged in");

  const res = await fetch(`${token.origin}/api/mcp/whatelz`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  if (!res.ok) {
    throw new Error(`mcp call failed (${res.status}): ${await res.text()}`);
  }

  const body = (await res.json()) as {
    result?: unknown;
    error?: { code?: number; message?: string };
  };

  if (body.error) throw new Error(`mcp error: ${JSON.stringify(body.error)}`);
  return body.result;
}
