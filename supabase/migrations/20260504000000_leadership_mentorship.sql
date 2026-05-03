-- leadership and mentorship tables
-- updated_at pattern: matches career / hackathons / projects — DEFAULT now() only,
-- bumped by the application layer on each upsert (no DB-level trigger, consistent with peers).

-- ── leadership ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leadership (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        NOT NULL UNIQUE,
  organisation text        NOT NULL,
  body         text,
  role         text        NOT NULL,
  start_date   date        NOT NULL,
  end_date     date,
  description  text,
  tags         text[]      NOT NULL DEFAULT '{}',
  published    boolean     NOT NULL DEFAULT false,
  content      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leadership ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_leadership"   ON leadership FOR SELECT USING (published = true);
CREATE POLICY "service_write_leadership" ON leadership FOR ALL   USING (true) WITH CHECK (true);

-- ── mentorship ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mentorship (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE,
  programme   text        NOT NULL,
  organiser   text        NOT NULL,
  start_date  date        NOT NULL,
  end_date    date,
  description text,
  tags        text[]      NOT NULL DEFAULT '{}',
  published   boolean     NOT NULL DEFAULT false,
  content     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentorship ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_mentorship"   ON mentorship FOR SELECT USING (published = true);
CREATE POLICY "service_write_mentorship" ON mentorship FOR ALL   USING (true) WITH CHECK (true);
