-- RLS hardening for blog_posts + media_assets. All app reads go through
-- supabaseAdmin (service role, bypasses RLS), so this is a defence-in-depth
-- pass — no functional change. Long-standing follow-up from the vault Ops
-- Checklist. Signed off 2026-07-25.

ALTER TABLE blog_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Public: only published blog posts are readable via anon key.
DROP POLICY IF EXISTS "blog_posts_anon_read_published" ON blog_posts;
CREATE POLICY "blog_posts_anon_read_published"
  ON blog_posts FOR SELECT TO anon
  USING (status = 'published');

-- media_assets: admin-only. No anon policy — service role still bypasses RLS.
