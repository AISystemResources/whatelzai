-- Token auth infrastructure (SPRINT-098). Foundation for the whatelz CLI
-- and future service accounts for agent workflows (CMO/COO/CPO/CEO).
--
-- Design: no distinction between "personal" and "service" tokens — just
-- tokens with different scope widths. Owner tokens carry ['*']; agent
-- tokens will carry narrow scopes like ['blog:*', 'newsletter:send'].

-- ── auth_tokens ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      text NOT NULL UNIQUE,
  name            text NOT NULL,
  scopes          text[] NOT NULL,
  rate_limit_tier text NOT NULL DEFAULT 'default'
                    CHECK (rate_limit_tier IN ('default', 'agent', 'owner')),
  expires_at      timestamptz,
  last_used_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz
);

CREATE INDEX IF NOT EXISTS auth_tokens_user_id_idx ON auth_tokens (user_id);
CREATE INDEX IF NOT EXISTS auth_tokens_token_hash_idx ON auth_tokens (token_hash)
  WHERE revoked_at IS NULL;

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
-- No anon policy. Service role bypasses RLS; all app access goes through
-- supabaseAdmin.

-- ── audit_log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id      uuid REFERENCES auth_tokens(id) ON DELETE SET NULL,
  actor_type    text NOT NULL
                  CHECK (actor_type IN ('token', 'clerk', 'anon')),
  actor_id      text,
  action        text NOT NULL,
  resource_type text,
  resource_id   text,
  payload       jsonb,
  ip            inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_token_id_idx ON audit_log (token_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_type, actor_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- No anon policy. Admin reads via supabaseAdmin only.
