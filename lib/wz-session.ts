import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const WZ_SESSION_COOKIE = "wz_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// Read the wz_session cookie without setting one. Returns null if unset.
export async function readSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(WZ_SESSION_COOKIE)?.value ?? null;
}

// Ensure a wz_session cookie exists on this request/response cycle. Safe to
// call from server components — Next.js will refuse to write outside a
// mutation context, in which case we return the ambient id (or a fresh one
// if none exists) without persisting. The next mutation-context call will
// persist it.
export async function ensureSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(WZ_SESSION_COOKIE)?.value;
  if (existing) return existing;
  const fresh = randomUUID();
  try {
    jar.set({
      name: WZ_SESSION_COOKIE,
      value: fresh,
      maxAge: THIRTY_DAYS,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  } catch {
    // Cookies can't be mutated in a pure RSC render — fall through and
    // return the id. Whichever request later runs in a mutation context
    // (server action, route handler) will persist a fresh one at that point.
  }
  return fresh;
}
