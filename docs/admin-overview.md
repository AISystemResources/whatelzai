# Owner AI-business overview

The root of `admin.whatelz.ai` answers what needs attention and which accepted
commitments move the AI business forward. This chat owns admin; the separate
network-marketing chat owns the member app. No member pages, leads, team
relationships or assistant permissions are changed by this overview.

## Sources and decisions

`loadAdminOverview` independently calls the existing sole-owner policy before
accessing data. It reads the owner's Daily tasks, saved EMDEE Daily entries,
marketing workflow counts, local product metrics and the existing authenticated
EMDEE owner-metrics integration. The page is private, dynamic and not indexed.
Each source degrades independently; unavailable is never presented as an empty
queue, a zero metric or a completed task.

Focus shows up to three accepted, open AI-business commitments due today or
earlier. Blocked/waiting commitments require review and appear as attention
items; proposals remain proposals and deferred work does not silently reactivate.
Coming up shows at most three future accepted open AI-business commitments.
The underlying Daily loader is bounded to100 unfinished and100 current-day
completions across all lanes, so focus/attention figures explicitly describe the
loaded set. Completion is counted only from explicit done records.

Morning/evening previews render the existing canonical EMDEE Notes as Markdown
in a bounded scrolling area, preserving complete headings, lists and GFM tables.
Today and weekly reflection render Markdown too; Today keeps explicit Edit Markdown
controls. Raw HTML and remote image loading are disabled. Source content is unchanged. Before04:30 and21:00 Singapore,
a missing current entry is not due yet. Afterward it is not found, not proof that
a schedule failed. Saved entries similarly do not prove an unattended run.
Yesterday's closeout remains a read-only preview. No inference, schedule change,
commitment mutation, outbound message or publishing happens on page load.

Growth counts are exact server counts of blog drafts, newsletter drafts and
submitted pending testimonials. Incomplete testimonial requests are excluded.
Customers and sales opportunities are not sourced from member leads or email;
that integration remains explicitly unconnected.

## Metrics integrity

Local daily/weekly/monthly active-account metrics use users.last_seen_at. New
accounts use users.first_seen_at. Website visitor activity is separately named
in usage, based on visitors.last_seen. No measured recurring revenue or workspace
count exists for Whatelzai, so those contract values are null. Database failures
propagate to an unavailable product state instead of returning zero.

Remote metrics require the expected product identity, supported schema version,
valid timestamp and finite nonnegative numeric/null fields. Redirects are denied;
the existing short timeout covers reading and validating the response. Snapshots
older than24h or with invalid/future timestamps are called out before decisions.
The existing pure-data MCP metric response retains its shape; previously
misleading local metric values are corrected to their named meanings.

## Validation

Run the overview, owner, Daily and routing tests with the existing Node/tsx test
runner, then typecheck, lint changed files and build. Verify the owner view,
empty/partial states, clean Today deep links, anonymous protection and narrow
screen width. No database migration or new credential is required.
