-- RLS hardening for events + testimonial_templates (SPRINT-099).
-- Both tables are read/written exclusively via supabaseAdmin (service role,
-- bypasses RLS). Enabling RLS with no anon policies is defence-in-depth —
-- if the anon key ever accidentally hits these tables, it returns nothing
-- instead of the whole ledger. Matches the media_assets pattern from
-- SPRINT-095 (rls_hardening).

ALTER TABLE events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_templates ENABLE ROW LEVEL SECURITY;
