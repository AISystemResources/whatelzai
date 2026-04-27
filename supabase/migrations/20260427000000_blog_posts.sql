-- blog_posts: Supabase-backed blog storage, writable via WHATELZ_FUNCTION MCP

CREATE TABLE blog_posts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT        UNIQUE NOT NULL,
  title        TEXT        NOT NULL,
  summary      TEXT        NOT NULL DEFAULT '',
  content      TEXT        NOT NULL DEFAULT '',
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: hello-world post migrated from content/blog/hello-world.mdx
INSERT INTO blog_posts (slug, title, summary, content, tags, status, published_at)
VALUES (
  'hello-world',
  'Hello, World',
  'First post — a placeholder to prove the blog works.',
  E'This is the first post on whatelz.ai. More coming soon.\n\n## What this site is\n\nwhatelz.ai is Edmund Lin Zhenming''s personal site — AI engineer, graduating October 2026.\n\nThe blog is where I''ll write about things I''m building, learning, and thinking about.',
  ARRAY['meta'],
  'published',
  '2026-04-26T00:00:00Z'
);
