import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { URL } from "node:url";
import open from "open";

// Override for local dev / preview branches (e.g. WHATELZ_ORIGIN=http://localhost:3100).
export const ORIGIN = process.env.WHATELZ_ORIGIN ?? "https://whatelz.ai";
const TOKEN_PATH = join(homedir(), ".config", "whatelz", "token.json");

export interface StoredToken {
  access_token: string;
  token_type: string;
  expires_at: number;
  origin: string;
}

export async function saveToken(
  t: Omit<StoredToken, "origin">,
  origin: string,
): Promise<void> {
  await mkdir(dirname(TOKEN_PATH), { recursive: true });
  await writeFile(TOKEN_PATH, JSON.stringify({ ...t, origin }, null, 2), {
    mode: 0o600,
  });
}

export async function loadToken(): Promise<StoredToken | null> {
  try {
    const raw = await readFile(TOKEN_PATH, "utf8");
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await rm(TOKEN_PATH);
  } catch {
    /* already gone */
  }
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function pkce(): { verifier: string; challenge: string } {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function waitForCode(port: number, expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const srv = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      if (url.pathname !== "/callback") {
        res.statusCode = 404;
        res.end();
        return;
      }
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const finish = (status: number, body: string, err?: Error) => {
        res.statusCode = status;
        res.setHeader("Content-Type", "text/html");
        res.end(body);
        srv.close();
        err ? reject(err) : resolve(code!);
      };
      if (state !== expectedState) {
        finish(400, "<p>State mismatch. Login aborted.</p>", new Error("state mismatch"));
        return;
      }
      if (!code) {
        finish(400, "<p>No code returned. Login aborted.</p>", new Error("no code"));
        return;
      }
      finish(
        200,
        `<!doctype html><html><body style="font-family:-apple-system,sans-serif;padding:2rem;max-width:32rem;margin:0 auto">
          <h2 style="margin:0 0 .5rem">Connected to whatelz.ai</h2>
          <p style="color:#666">You can close this tab and return to the terminal.</p>
        </body></html>`,
      );
    });
    srv.listen(port, "127.0.0.1");
    setTimeout(
      () => {
        srv.close();
        reject(new Error("login timed out after 5 minutes"));
      },
      5 * 60 * 1000,
    );
  });
}

export async function login(): Promise<StoredToken> {
  const { verifier, challenge } = pkce();
  const state = b64url(randomBytes(16));
  const port = await getFreePort();
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  const authUrl = new URL(`${ORIGIN}/api/oauth/authorize`);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const codePromise = waitForCode(port, state);

  console.log(`Opening browser to authorize with ${ORIGIN}…`);
  console.log(`If it doesn't open, paste this URL:\n${authUrl.toString()}\n`);
  await open(authUrl.toString());

  const code = await codePromise;

  const form = new URLSearchParams();
  form.set("code", code);
  form.set("code_verifier", verifier);
  const res = await fetch(`${ORIGIN}/api/oauth/token`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(
      `token exchange failed (${res.status}): ${await res.text()}`,
    );
  }
  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  const token: Omit<StoredToken, "origin"> = {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  };
  await saveToken(token, ORIGIN);
  return { ...token, origin: ORIGIN };
}
