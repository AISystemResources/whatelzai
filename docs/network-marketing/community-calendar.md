# Founder’s Club calendar

The signed-in member calendar at `/calendar` is a saved copy of invitations from the owner-authorized sender. Month view, agenda, search and activity filters use Malaysia/Singapore time. No RSVP, ticket purchase, contact creation, guest-email import or automatic synchronization occurs.

## Import and refresh

Read all Gmail messages from the authorized sender. Fetch original RFC822 messages when the attachment connector cannot extract ICS; decode the `application/ics` MIME part. Preserve Unicode and folded calendar lines. Do not follow RSVP or sender-trust links. Store only allowlisted schedule fields; exclude attendees, descriptions, meeting access credentials, alarms and mail headers. Keep the export under ignored `supabase/private/`, never in the public repository.

Run `node --import tsx scripts/import-community-calendar.ts supabase/private/founders-calendar-import.json --dry-run` first; then repeat with `--env-file=.env.local` before `--import` and without `--dry-run`. The script refuses credentials for another Supabase project. Pin parser `ical.js` to 2.2.1.

Records deduplicate by UID + recurrence ID. Higher SEQUENCE wins, then LAST-MODIFIED/DTSTAMP, then receipt time. Latest complete snapshots are selected by import date, with row-count verification before publishing. Repeating imports are idempotent. Keep every historical snapshot; no deletes. A refresh must include the full sender history, including cancellations and updates, not just new messages.

The server expands recurring rules, EXDATE and date-specific overrides for the requested month. Cancelled series/occurrences are omitted. Exceptions received without a parent series display as standalone invitations. DATE end values are exclusive; multi-day entries appear on each overlapping date. Recurring future instances represent schedule patterns, not a host confirmation. Timed entries must include a timezone. Imports reject timezone definitions outside Asia/Singapore and Asia/Kuala_Lumpur; extending this requires tests.

## Access and verification

Both tables have RLS and no anon/authenticated grants. Only the server service role imports/reads; page and loader independently require a verified application user. ICS, source message IDs and revision fields remain server-side. Clients get event title, location, dates, category and recurrence marker. Data is never publicly cached. Import metadata is hidden until its records verify.

Calendar visibility now follows explicitly confirmed personas in private `community_calendar_memberships`. Admins assign signed-in accounts at `/admin/calendar-access`; default is Guest. Oracle is reserved for Dick Lim with explicit confirmation and a unique single-account constraint. Application admins can review all events or preview a persona without changing their account. Query parameters cannot elevate a non-admin. Names, team links, ABO number fields and editable auth metadata do not confer club access.

Badminton/Captain Ball: Oracle, Catalyst, Spark; Guests need Catalyst invitation to attend. Monday/Wednesday classes, HQ tour/Shopping Tour, HQH and Intro/Gather/Collab: Oracle/Catalyst. Intro/Gather/Collab eligibility for Sparks/Guests awaits Edmund’s clarification. Unknown titles fail closed for members and show “Audience to confirm” in founder/admin review. Seeing a guest-eligible event is not an invitation or RSVP; there is no attendance/invitation ledger yet. Rules live in `lib/community-calendar/personas.ts` and must be confirmed before widening.

Today is the full local UTC+8 date, refreshed every minute while open. Day cells expose `aria-current=date`; the current date is yellow and selected dates have a separate blue outline. Past days are grey. Events stay relevant through their end time; ended events move into an expandable reference section unless a particular date is selected.

Run calendar and routing regression tests, typecheck, changed-file lint, format and production build. Verify database counts and grants; verify anonymous redirect and signed-in desktop/mobile month navigation, filters, date selection and agenda. Rollback by removing calendar links/page; retain imported data.

## Initial snapshot — 10 October 2026 (Malaysia/Singapore)

80 calendar invitation/update messages reconciled to 68 records; 45 October occurrences and 34 November occurrences. Identical standalone and recurring occurrences display once. The other 14 sender messages were ticket receipts or email verification, not calendar invitations. Latest versions include changed titles/times. The import is not evidence of attendance or registration.
