-- Drop the entire job-hunt schema.
-- Feature was ripped out in PR #81 (feat/115-nuke-hunt-apply); no code
-- references these tables anymore. Sign-off from Edmund on 2026-07-25.
--
-- Order handles FKs; CASCADE covers indexes, triggers, and any
-- forgotten dependent objects.

DROP TABLE IF EXISTS application_events CASCADE;
DROP TABLE IF EXISTS applications      CASCADE;
DROP TABLE IF EXISTS emails            CASCADE;
DROP TABLE IF EXISTS job_listings      CASCADE;
DROP TABLE IF EXISTS companies         CASCADE;
DROP TABLE IF EXISTS resumes           CASCADE;
DROP TABLE IF EXISTS user_profile      CASCADE;
