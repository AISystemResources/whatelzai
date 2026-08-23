"use client";

import { useEffect, useRef, useState } from "react";
import { SignUp, useUser } from "@clerk/nextjs";

// Client-side stitch trigger. On sign-in, POST to /api/stitch/me so orphan
// entitlements (SPR-111) bind to the freshly-signed-in Clerk user, and any
// in-tab quiz attempt id (from SPR-108's sessionStorage) links to it too.
function useStitchOnSignIn(isSignedIn: boolean | undefined): {
  status: "idle" | "stitching" | "done" | "error";
  bound: { entitlements: number; quiz: number } | null;
} {
  const [status, setStatus] = useState<"idle" | "stitching" | "done" | "error">(
    "idle",
  );
  const [bound, setBound] = useState<{
    entitlements: number;
    quiz: number;
  } | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!isSignedIn || fired.current) return;
    fired.current = true;

    let attemptId: string | null = null;
    try {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith("quiz:") && key.endsWith(":preview")) {
          const raw = window.sessionStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as { attempt_id?: string };
            if (parsed?.attempt_id) {
              attemptId = parsed.attempt_id;
              break;
            }
          }
        }
      }
    } catch {
      // ignore parse / storage errors
    }

    setStatus("stitching");
    fetch("/api/stitch/me", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(attemptId ? { attempt_id: attemptId } : {}),
    })
      .then((r) => r.json())
      .then((j) => {
        setBound({
          entitlements: (j?.entitlements_bound as number) ?? 0,
          quiz: (j?.quiz_attempts_bound as number) ?? 0,
        });
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [isSignedIn]);

  return { status, bound };
}

export function SignUpBlock({
  prefilledEmail,
}: {
  prefilledEmail: string | null;
}) {
  const { isSignedIn, user } = useUser();
  const { status, bound } = useStitchOnSignIn(isSignedIn);

  if (isSignedIn) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
        <p>
          You&apos;re signed in as{" "}
          <span className="font-medium">
            {user?.emailAddresses?.[0]?.emailAddress ?? user?.id}
          </span>
          .{" "}
          {status === "done" && bound && bound.entitlements > 0
            ? "Your Playbook access is linked."
            : status === "done"
              ? "Your account is ready — Playbook access links automatically when the emails match."
              : "Linking your Playbook access…"}
        </p>
        <p className="mt-3">
          <a href="/account" className="underline">
            Go to your account →
          </a>
        </p>
      </div>
    );
  }

  return (
    <SignUp
      routing="hash"
      signInUrl="/sign-in"
      forceRedirectUrl="/account"
      initialValues={
        prefilledEmail ? { emailAddress: prefilledEmail } : undefined
      }
    />
  );
}
