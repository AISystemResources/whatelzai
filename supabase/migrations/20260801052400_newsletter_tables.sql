-- Newsletter infrastructure (SPRINT-101). Three tables for "What ELZ This Week?":
-- issues (the content), subscribers (the list), distributions (cross-post URLs).

-- ── newsletter_issues ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  issue_number   int  NOT NULL UNIQUE,
  title          text NOT NULL,
  subtitle       text,
  summary        text,
  content        text NOT NULL,
  status         text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'sent')),
  published_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_issues_status_idx
  ON newsletter_issues (status, published_at DESC);

ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_issues_anon_read_sent" ON newsletter_issues;
CREATE POLICY "newsletter_issues_anon_read_sent"
  ON newsletter_issues FOR SELECT TO anon
  USING (status = 'sent');

-- ── newsletter_subscribers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL UNIQUE,
  name               text,
  status             text NOT NULL DEFAULT 'confirmed'
                       CHECK (status IN ('confirmed', 'unsubscribed')),
  source             text,
  unsubscribe_token  text NOT NULL UNIQUE,
  confirmed_at       timestamptz,
  unsubscribed_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx
  ON newsletter_subscribers (status);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- No anon policy — subscriber list is admin-only. Public subscribe/unsubscribe
-- flows go through service-role API endpoints, not direct table access.

-- ── newsletter_distributions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_distributions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id      uuid NOT NULL REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  platform      text NOT NULL
                  CHECK (platform IN ('whatelz', 'resend', 'linkedin', 'medium', 'substack', 'beehiiv')),
  external_url  text,
  published_at  timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, platform)
);

CREATE INDEX IF NOT EXISTS newsletter_distributions_issue_idx
  ON newsletter_distributions (issue_id);

ALTER TABLE newsletter_distributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_distributions_anon_read_sent" ON newsletter_distributions;
CREATE POLICY "newsletter_distributions_anon_read_sent"
  ON newsletter_distributions FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM newsletter_issues i
      WHERE i.id = newsletter_distributions.issue_id
        AND i.status = 'sent'
    )
  );
