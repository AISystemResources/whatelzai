-- SPRINT-105: soft-trash lifecycle for whole docs. Adds trashed_at as a
-- sidecar column on docs_sections so version history in docs_section_versions
-- remains intact. All read helpers gain a WHERE trashed_at IS NULL filter.
--
-- Semantics (per CMO handoff): trash_doc sets trashed_at on all is_current
-- sections of the slug; restore_doc clears it; delete_doc hard-deletes rows
-- (cascade via FK on docs_section_versions if configured).

ALTER TABLE docs_sections
  ADD COLUMN IF NOT EXISTS trashed_at timestamptz;

-- Partial index so filtering trashed_at IS NULL on hot reads stays fast.
CREATE INDEX IF NOT EXISTS docs_sections_active_idx
  ON docs_sections (doc_slug)
  WHERE is_current = true AND trashed_at IS NULL;
