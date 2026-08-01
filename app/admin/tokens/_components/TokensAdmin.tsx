"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SCOPES, OWNER_SCOPE } from "@/lib/auth/scopes";

export type TokenRow = {
  id: string;
  name: string;
  scopes: string[];
  rate_limit_tier: "default" | "agent" | "owner";
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

const TIER_OPTIONS = ["default", "agent", "owner"] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TokensAdmin({ initialTokens }: { initialTokens: TokenRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showIssue, setShowIssue] = useState(false);
  const [newToken, setNewToken] = useState<{
    name: string;
    token: string;
  } | null>(null);

  const active = initialTokens.filter((t) => !t.revoked_at);
  const revoked = initialTokens.filter((t) => t.revoked_at);

  async function handleRevoke(id: string, name: string) {
    if (
      !confirm(
        `Revoke token "${name}"? This is immediate and cannot be undone.`,
      )
    )
      return;
    const res = await fetch(`/api/admin/tokens/${id}/revoke`, {
      method: "POST",
    });
    if (!res.ok) {
      alert(`Revoke failed: ${await res.text()}`);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowIssue(true)}
          className="border border-zinc-900 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          + Issue token
        </button>
      </div>

      {newToken && (
        <div className="border border-amber-300 bg-amber-50 p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-amber-900">
            Copy this token now — you will never see it again
          </p>
          <p className="mt-2 text-sm text-amber-900">
            Token <strong>{newToken.name}</strong>:
          </p>
          <code className="mt-3 block break-all rounded bg-white p-3 font-mono text-sm text-zinc-900 border border-amber-200">
            {newToken.token}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(newToken.token);
            }}
            className="mt-3 border border-amber-900 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-amber-900 hover:bg-amber-900 hover:text-amber-50"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={() => setNewToken(null)}
            className="mt-3 ml-2 border border-zinc-400 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-zinc-600 hover:bg-zinc-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Active ({active.length})
        </h2>
        <div className="mt-3 border border-zinc-200 rounded divide-y divide-zinc-100">
          {active.length === 0 && (
            <p className="px-4 py-6 text-sm text-zinc-400">No active tokens.</p>
          )}
          {active.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-4 px-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{t.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {t.scopes.map((s) => (
                    <span
                      key={s}
                      className="font-mono text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))}
                  <span className="font-mono text-[10px] text-zinc-400">·</span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    tier: {t.rate_limit_tier}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-zinc-400">
                  Created {formatDate(t.created_at)} · Last used{" "}
                  {formatDate(t.last_used_at)}
                  {t.expires_at && ` · Expires ${formatDate(t.expires_at)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(t.id, t.name)}
                disabled={pending}
                className="shrink-0 font-mono text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </section>

      {revoked.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Revoked ({revoked.length})
          </h2>
          <div className="mt-3 border border-zinc-100 rounded divide-y divide-zinc-100">
            {revoked.map((t) => (
              <div key={t.id} className="px-4 py-3 opacity-60">
                <p className="text-sm text-zinc-500 line-through">{t.name}</p>
                <p className="font-mono text-[10px] text-zinc-400">
                  Revoked {formatDate(t.revoked_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {showIssue && (
        <IssueModal
          onClose={() => setShowIssue(false)}
          onIssued={(t) => {
            setNewToken(t);
            setShowIssue(false);
            startTransition(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}

function IssueModal({
  onClose,
  onIssued,
}: {
  onClose: () => void;
  onIssued: (t: { name: string; token: string }) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tier, setTier] = useState<TokenRow["rate_limit_tier"]>("default");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleScope(scope: string) {
    const next = new Set(selected);
    if (next.has(scope)) next.delete(scope);
    else next.add(scope);
    setSelected(next);
  }

  function toggleGroupWildcard(resource: string) {
    const wildcard = `${resource}:*`;
    const next = new Set(selected);
    if (next.has(wildcard)) next.delete(wildcard);
    else next.add(wildcard);
    setSelected(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one scope (or the owner wildcard)");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        scopes: Array.from(selected),
        rate_limit_tier: tier,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(`Issue failed: ${await res.text()}`);
      return;
    }
    const body = (await res.json()) as { name: string; token: string };
    onIssued({ name: body.name, token: body.token });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-zinc-200 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Issue token
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Name is for your reference. Scopes are checked on every write.
            </p>
          </div>

          <div>
            <label
              htmlFor="token-name"
              className="block font-mono text-xs uppercase tracking-widest text-zinc-500"
            >
              Name
            </label>
            <input
              id="token-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. edmund-macbook, cmo-agent-prod"
              className="mt-2 w-full border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-zinc-500">
              Rate limit tier
            </label>
            <div className="mt-2 flex gap-2">
              {TIER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTier(opt)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-widest border ${
                    tier === opt
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 text-zinc-600 hover:border-zinc-500"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-zinc-500">
              Scopes
            </label>
            <div className="mt-2 space-y-3">
              <button
                type="button"
                onClick={() => toggleScope(OWNER_SCOPE)}
                className={`w-full text-left px-3 py-2 border ${
                  selected.has(OWNER_SCOPE)
                    ? "border-amber-500 bg-amber-50 text-amber-900"
                    : "border-zinc-300 hover:border-zinc-500"
                }`}
              >
                <span className="font-mono text-xs">
                  * (owner — matches everything)
                </span>
              </button>

              {Object.entries(SCOPES).map(([resource, actions]) => (
                <div key={resource} className="border border-zinc-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-xs uppercase tracking-widest text-zinc-700">
                      {resource}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleGroupWildcard(resource)}
                      className={`font-mono text-[10px] px-2 py-0.5 border ${
                        selected.has(`${resource}:*`)
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 text-zinc-500 hover:border-zinc-500"
                      }`}
                    >
                      {resource}:*
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((action) => {
                      const scope = `${resource}:${action}`;
                      return (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => toggleScope(scope)}
                          className={`font-mono text-[10px] px-2 py-1 border ${
                            selected.has(scope)
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                          }`}
                        >
                          {action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="border border-zinc-900 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
            >
              {submitting ? "Issuing…" : "Issue token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
