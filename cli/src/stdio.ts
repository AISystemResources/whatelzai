import { rpcCall } from "./mcp.js";
import { loadToken, currentProfile } from "./auth.js";

// Minimal MCP-over-stdio server. Reads newline-delimited JSON-RPC messages
// from stdin, forwards each to the whatelz HTTP MCP, writes responses to
// stdout. This is what lets Claude Code register `whatelz mcp` as a native
// MCP server via `.mcp.json`.
//
// We do NOT re-implement MCP protocol logic here — we're a pure proxy.
// Server-side handles initialize/tools/list/tools/call; we just relay.

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function send(response: JsonRpcResponse): void {
  process.stdout.write(JSON.stringify(response) + "\n");
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

async function handleMessage(raw: string): Promise<void> {
  let req: JsonRpcRequest;
  try {
    req = JSON.parse(raw) as JsonRpcRequest;
  } catch {
    // Parse error — no id available.
    send(errorResponse(null, -32700, "Parse error"));
    return;
  }

  const id = req.id ?? null;
  if (req.jsonrpc !== "2.0" || typeof req.method !== "string") {
    send(errorResponse(id, -32600, "Invalid Request"));
    return;
  }

  // MCP `notifications/*` are one-way — no response expected.
  if (req.method.startsWith("notifications/")) return;

  try {
    const result = await rpcCall(req.method, req.params);
    send({ jsonrpc: "2.0", id, result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    send(errorResponse(id, -32603, message));
  }
}

export async function runStdioServer(): Promise<void> {
  // Pre-flight: require an active token so we fail fast if the user hasn't
  // logged in. Otherwise every tool call would bubble the same error.
  const token = await loadToken();
  if (!token) {
    console.error(
      `whatelz mcp: no token for profile "${currentProfile()}" — run "whatelz login" first`,
    );
    process.exit(1);
  }

  process.stdin.setEncoding("utf8");
  let buffer = "";
  process.stdin.on("data", (chunk: string) => {
    buffer += chunk;
    let idx = buffer.indexOf("\n");
    while (idx >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line.length > 0) void handleMessage(line);
      idx = buffer.indexOf("\n");
    }
  });
  process.stdin.on("end", () => process.exit(0));

  // Keep the process alive.
  return new Promise(() => {});
}
