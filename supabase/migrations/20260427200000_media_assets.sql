-- Media assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path  TEXT        NOT NULL UNIQUE,
  url           TEXT        NOT NULL,
  filename      TEXT        NOT NULL,
  mime_type     TEXT        NOT NULL DEFAULT 'image/jpeg',
  size_bytes    INTEGER,
  label         TEXT        NOT NULL DEFAULT '',
  description   TEXT        NOT NULL DEFAULT '',
  destinations  TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reuse existing trigger function (created in blog_posts migration)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Supabase Storage bucket (public, 10 MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;
