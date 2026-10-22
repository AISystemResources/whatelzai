# Activated-member Chat and credit resets

A registered, tree-assigned fcOS user is eligible for AI Chat. Enrollment is lazy
on Chat access and backfilled for existing activated users by migration; neither
step creates an allowance cycle, erases history or invokes a provider. Existing
models remain; new members use the existing economical model default. The global
MEMBER_AI_ENABLED switch remains in charge of provider availability. Platform
credentials remain server-only and owned by the configured administrator; member
context uses only that member's permitted records and optional vault connection.

Owner Users → Manage AI credits & resets shows all activated members and current
remaining, spent and reserved allowance. Choose selected members or All activated,
then a full US$5 or half US$2.50 reset. Review names, amount per person and total
before confirming. A reset starts a new period with that amount available. It is
not a top-up: old unused balance is not added. The ordinary US$5 monthly baseline
returns at the next Singapore month boundary. Old cycles, costs, pending/uncertain
reservations, conversations and administrator audit records stay intact. Late
settlement always charges its original cycle.

The owner-gated action validates a bounded unique target set (1–1000). The SQL
function rechecks assignment and signed-in account mappings, compares the reviewed
all-member roster when applicable, locks accounts in ID order and compares every
current-cycle pointer. One stale/invalid target rolls back the whole transaction.
A duplicate submit with old cycle IDs cannot grant twice. Unknown transport outcomes
must be read back before a new reviewed reset; no automatic retry is performed.
No recipient, grant amount or actor identity comes from model output.

The old full-reset SQL signature delegates to the new function for compatibility.
Only service_role can execute enrollment or reset functions. The application
independently enforces the configured sole-owner policy; stored role alone is not
sufficient to invoke admin actions. Browser database grants/RLS remain unchanged.

## Migration and validation

Apply 20261022053000_activated_chat_resets.sql before publishing application code.
The migration adds service-only functions, updates the legacy reset wrapper and
rechecks activation in the existing reservation function. Backfill activates normal
Chat enrollment but does not issue resets or change current cycles. Record the
migration atomically in supabase_migrations.schema_migrations. Verify existing
cycle pointers/spend and function execute permissions after applying it.

Local SQL tests cover enrollment, denied unassigned accounts, full/half amounts,
unchanged monthly baseline, stale/replayed and partial bulk failure, late request
settlement, retained audit/history and browser execute denial. Application tests
cover activated non-owner access, owner-only reset actions and strict target input.
Live verification opens the owner controls and cancels reviewed examples; do not
issue real resets as tests or spend API credits without a user request.

Rollback deploys the prior app and restores prior function definitions from the
previous migration; keep all cycles/audit rows. If revoking expanded Chat access,
restore the old owner-only server gate as well. Never delete new credit history
or change credentials to roll back this feature.
