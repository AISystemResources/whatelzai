# Authentication migration checks

Use a disposable, empty local Postgres database only. The fixture contains synthetic identities and simplified legacy billing tables. On a Supabase Postgres image, connect as `supabase_admin` to apply the auth foreign key.

From the repo root, concatenate these files in order and pipe to `psql -v ON_ERROR_STOP=1`:

1. `supabase/tests/auth_identity_fixture.sql`
2. `supabase/migrations/20260718000003_users.sql`
3. `supabase/migrations/20261003125442_team_relationships.sql`
4. `supabase/migrations/20261003130748_protect_clerk_user_roles.sql`
5. `supabase/tests/auth_identity_legacy_fixture.sql`
6. `supabase/migrations/20261003134626_supabase_auth_team_profiles.sql`
7. `supabase/migrations/20261003135144_team_member_contact_details.sql`
8. `supabase/tests/auth_identity_migration.sql`

Checks cover stable legacy ownership and role preservation, no email-based identity/team claims, service-only access, audit actor compatibility, email validation and leading zeros in ABO numbers. These checks do not validate Google's remote OAuth configuration or a browser session.
