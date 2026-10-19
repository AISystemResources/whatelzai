# Private daily workspace (SPR-124)

Admin home `/` now shows Overview. `/command-center` redirects home; the old
website-content/traffic dashboard lives at `/site-dashboard` under AI Business.
Its obsolete test briefing card is no longer displayed. Existing stored cards
are not deleted. `Today` is a separate first-class admin destination.

## Storage ownership

Whatelzai stores owner-scoped commitments, check-in dates, acceptance/completion,
optimistic revisions, EMDEE document references, bounded AI attempts and encrypted
connection configuration. Canonical morning/evening Markdown lives only in EMDEE.
An historical brief never silently changes current operational task status.

Every page, loader, action and OAuth callback requires the configured sole owner
from SPR-125. The new tables have RLS and no public/anon/authenticated grants;
only independently authorized server code uses the service role. Future shared
productivity belongs on the member surface with explicit owner scoping, never
by opening the personal admin workspace to other accounts.

## Connections

Provision a 64-hex-character `DAILY_INTEGRATION_KEY` on each deployment. Keep it
outside the database and out of browser bundles. It encrypts credentials using
AES-256-GCM with a fresh nonce. Losing/changing the key requires reconnecting.

On `/today/connections`, connect EMDEE with OAuth PKCE. Registration and callback
origins are constrained to the admin host, the current Vercel preview deployment,
or the explicit development origin. State is owner-bound, encrypted, valid for
10 minutes and consumed on success. Tokens expire according to EMDEE; reconnect
rather than pretending an expired token works. No personal CLI/chat credential
is copied into deployment configuration.

The requested OAuth scopes permit document reads and writes only to the chosen
parent document and briefing folder. EMDEE's own consent/agent scope checks remain
in charge. Default parent is the dedicated `DAILY-BRIEFINGS.md` project hub;
other parents must already exist. Parent updates and document edits use strict
observed hashes. New documents are linked atomically with `create_child`.

Configure your own OpenAI project key and chosen model ID in the owner-only UI.
Model access is checked without inference, and the key is never redisplayed.
The chosen model must support the Responses API and structured outputs. No model
or spend has been selected on Edmund's behalf. Disconnecting removes stored
credentials; revocation at the provider is a separate action.

## Daily flow

All dates use Asia/Singapore. Yesterday's exact evening document is read before
morning preparation. Missing and unavailable are separate states. Unavailable
EMDEE reads disable document editing to prevent accidental overwrites. Briefs
use Markdown H3 headings inside the canonical Notes section; H1/H2 headings are
rejected to preserve EMDEE relationships and section boundaries.

Tasks start as proposals; acceptance is explicit. Unfinished work carries forward
unless moved to a later check-in or dropped. Deferred work remains accessible.
Actions use revision guards. Up to 100 unfinished tasks and 100 current-day
completions are loaded; nothing outside those bounds is claimed as exhaustive.

AI preparation is manual, produces an editable draft, never mutates tasks and
never saves the draft until Edmund submits it. Sources: operational records,
yesterday's EMDEE closeout, and supplied notes. Calendar/email/book search are
explicitly unavailable. Source documents are data, not execution authority.
Each workflow/day gets three atomically reserved attempts, failures included;
provider calls have a 45-second timeout, 2,000 output-token cap, 60,000-character
input cap and `store:false`. These bounds do not promise a dollar-denominated
budget or a fixed token price. Run records retain metadata, never brief bodies.

08:00/21:00 schedules are **not enabled**. Existing ChatGPT schedules are unchanged.
Validate manual use and connections before scheduling. This is a bounded daily
workflow in the established Next.js stack, with reusable domain/provider modules;
it is not an endless agent loop or a new eve application.

## Verification

Run the daily/owner/routing/team suites, TypeScript, changed-file lint,
formatting and the production build. Daily tests cover Singapore midnight,
credential encryption/tampering, EMDEE optimistic writes/readback, unavailable
sources, owner denial, OAuth PKCE/scopes/state, provider request bounds and failed
attempt limits. Remote table checks confirm service access and anonymous denial.
No private notes, credentials or actual customer data belong in test fixtures.
