# Member assistant pilot

The member assistant lives at `app.whatelz.ai/assistant`. The current API pilot is Edmund-only. The owner manages stored pilot
access and allowance resets at `admin.whatelz.ai/users`. Personal admin Daily
remains ChatGPT/MCP based; `DAILY_API_GENERATION_ENABLED` stays off. EMDEE only
stores/retrieves knowledge and verifies OAuth identity. It performs no inference.

## Access and identity

Every conversation, request, allowance and commitment belongs to immutable
`public.users.id`, not an email. Activation requires an existing authenticated
account chosen by the configured sole owner. Names/emails never claim accounts
or team profiles. Inactive members cannot read chats or invoke tools. In this phase, even an activated
non-owner cannot use the assistant: `memberActor` verifies the configured stable owner
ID and privileged stored role before reading pilot access, reserving allowance or
reaching the provider. Missing owner configuration fails closed. Leads, notes and
resources retain their independent member permissions.

An optional EMDEE PKCE connection uses the member's own account and read scope.
The identity endpoint verifies the resource-bound OAuth subject and vault UUID.
The member confirms the returned account before linking. Unique constraints and
an immutable identity trigger enforce one Whatelzai account to one EMDEE subject
and vault. Disconnect removes credentials, retaining the verified identity.
No automatic account merging or provider-ID replacement occurs. OAuth tokens
remain encrypted server-side. Every knowledge read revalidates identity and
restricts paths to the chosen existing own collection and child directory;
shared wrappers and traversal are denied. No vault write tool is included.

## Allowance

Each activated member gets US$5 per Singapore calendar month. `Full reset` starts
a fresh allowance cycle ending at the next month boundary; it grants additional
spending and never erases usage history. In-flight replies settle against their
original cycle. The server rechecks the configured owner for each admin action.

`MEMBER_AI_ENABLED=true` explicitly enables member inference. Default is off.
The server uses only the provider key in the owner's encrypted OpenAI connection,
never the owner's EMDEE token or personal notes. Provider calls are accepted only
on the member origin (or exact deployment preview/development origin), with a
matching Origin header and verified activated owner account.

The current owner pilot uses GPT-6.1 Sol (enabled 2026-10-22), with low reasoning through Responses. Stored model selection controls each request; US$5 allowance and usage history are unchanged.

GPT-6 Luna pricing: US$0.10/M input and US$0.50/M output tokens. GPT-6.1 Sol: US$2/M input and US$10/M output. Checked 2026-10-22 against the OpenAI
model documentation. Rates must be rechecked before changing models. Cached
input is conservatively counted at the uncached rate; this is an allowance
estimate, not a provider invoice. No automatic model escalation/fallback.

An atomic database reservation covers at most four provider calls, each with
60,000 serialized UTF-8 bytes plus a conservative protocol token margin and
1,024 output tokens. Usage receipts release unused reservation. Unknown provider
outcomes retain the entire reservation, displayed separately. Requests are
idempotent, only one can run per member at a time, and each member has a 30/hour
attempt limit. Conversations are capped at 100 messages; latest 20 form context.
No browser receives the provider key or raw OAuth credential.

## Tools and approval

Tools read only the authenticated member's commitments and verified knowledge
collection, or prepare at most three commitment proposals. The model cannot
choose a different user ID. Proposals become open commitments only after the
member clicks Accept. Completion requires the member's own click and a revision
check. No email, calendar mutation, arbitrary URL fetch or code execution.

## Validation

Run `node --import tsx --test scripts/member-ai.test.ts` plus the existing daily,
owner, auth, routing and team suites; typecheck, changed-file lint and production
build. Verify SQL reservation/idempotency, reset settlement, unique identities,
RLS/privilege denial and quota rejection in an isolated Postgres fixture before
applying the additive migration. Verify mobile layout and a bounded live reply
before enabling other pilot accounts. Never commit real pilot names, account
identifiers, email addresses, credentials or private transcripts as fixtures.

On narrow screens the conversation and composer precede the supporting panels;
a compact allowance link jumps to usage and conversations. Currency balances
use cents while usage receipts keep micro-dollar precision.

Chat follows the mobile visual viewport. The bottom navigation hides while an editable field and substantial keyboard height reduction are detected, then restores after dismissal; pinch zoom and normal toolbar movement do not count as a keyboard. The rounded composer owns focus feedback; the inner textarea has no separate outline or border.
