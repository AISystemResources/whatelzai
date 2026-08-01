import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "./supabase-server";

export type IssueStatus = "draft" | "sent";
export type SubscriberStatus = "confirmed" | "unsubscribed";
export type DistributionPlatform =
  | "whatelz"
  | "resend"
  | "linkedin"
  | "medium"
  | "substack"
  | "beehiiv";

export interface NewsletterIssue {
  id: string;
  slug: string;
  issue_number: number;
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string;
  status: IssueStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  source: string | null;
  unsubscribe_token: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface NewsletterDistribution {
  id: string;
  issue_id: string;
  platform: DistributionPlatform;
  external_url: string | null;
  published_at: string | null;
  notes: string | null;
  created_at: string;
}

// ── Issues ────────────────────────────────────────────────────────────

export async function listIssues(
  includeDraft = false,
): Promise<NewsletterIssue[]> {
  let q = supabaseAdmin
    .from("newsletter_issues")
    .select("*")
    .order("issue_number", { ascending: false });
  if (!includeDraft) q = q.eq("status", "sent");
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as NewsletterIssue[];
}

export async function getIssueBySlug(
  slug: string,
): Promise<NewsletterIssue | null> {
  const { data } = await supabaseAdmin
    .from("newsletter_issues")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as NewsletterIssue | null) ?? null;
}

export async function getIssueById(
  id: string,
): Promise<NewsletterIssue | null> {
  const { data } = await supabaseAdmin
    .from("newsletter_issues")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as NewsletterIssue | null) ?? null;
}

export interface CreateIssueInput {
  slug: string;
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
}

// Auto-assigns the next issue_number (max + 1, or 1 if empty). Callers pass
// only content fields; the ledger position is derived.
export async function createIssue(
  input: CreateIssueInput,
): Promise<NewsletterIssue> {
  const { data: maxRow } = await supabaseAdmin
    .from("newsletter_issues")
    .select("issue_number")
    .order("issue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = ((maxRow?.issue_number as number | undefined) ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("newsletter_issues")
    .insert({
      slug: input.slug,
      issue_number: nextNumber,
      title: input.title,
      subtitle: input.subtitle ?? null,
      summary: input.summary ?? null,
      content: input.content,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;
  return data as NewsletterIssue;
}

export interface UpdateIssueInput {
  slug?: string;
  title?: string;
  subtitle?: string | null;
  summary?: string | null;
  content?: string;
}

export async function updateIssue(
  id: string,
  input: UpdateIssueInput,
): Promise<NewsletterIssue> {
  const patch: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin
    .from("newsletter_issues")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as NewsletterIssue;
}

export async function deleteIssue(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("newsletter_issues")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Subscribers ───────────────────────────────────────────────────────

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateUnsubscribeToken(): string {
  return randomBytes(24).toString("base64url");
}

export interface SubscribeInput {
  email: string;
  name?: string;
  source?: string;
}

// Idempotent: subscribing an existing email re-activates them if previously
// unsubscribed, or is a no-op if already confirmed. Returns the subscriber.
export async function subscribe(
  input: SubscribeInput,
): Promise<NewsletterSubscriber> {
  const email = normalizeEmail(input.email);
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const row = existing as NewsletterSubscriber;
    if (row.status === "unsubscribed") {
      const { data: updated, error } = await supabaseAdmin
        .from("newsletter_subscribers")
        .update({
          status: "confirmed",
          confirmed_at: now,
          unsubscribed_at: null,
          name: input.name ?? row.name,
          source: input.source ?? row.source,
        })
        .eq("id", row.id)
        .select()
        .single();
      if (error) throw error;
      return updated as NewsletterSubscriber;
    }
    return row;
  }

  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .insert({
      email,
      name: input.name ?? null,
      source: input.source ?? null,
      status: "confirmed",
      unsubscribe_token: generateUnsubscribeToken(),
      confirmed_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data as NewsletterSubscriber;
}

export async function unsubscribeByToken(
  token: string,
): Promise<{ ok: boolean; email?: string }> {
  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();
  if (error || !data) return { ok: false };
  return { ok: true, email: (data as { email: string }).email };
}

export async function listSubscribers(
  status?: SubscriberStatus,
): Promise<NewsletterSubscriber[]> {
  let q = supabaseAdmin
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as NewsletterSubscriber[];
}

export async function subscriberStats(): Promise<{
  confirmed: number;
  unsubscribed: number;
  total: number;
}> {
  const { data } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("status");
  const rows = (data ?? []) as { status: SubscriberStatus }[];
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const unsubscribed = rows.filter((r) => r.status === "unsubscribed").length;
  return { confirmed, unsubscribed, total: rows.length };
}

// ── Distributions ─────────────────────────────────────────────────────

export async function listDistributions(
  issueId: string,
): Promise<NewsletterDistribution[]> {
  const { data } = await supabaseAdmin
    .from("newsletter_distributions")
    .select("*")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });
  return (data ?? []) as NewsletterDistribution[];
}

export interface AddDistributionInput {
  issue_id: string;
  platform: DistributionPlatform;
  external_url?: string;
  published_at?: string;
  notes?: string;
}

// Upsert semantics: (issue_id, platform) is unique, so re-logging same
// platform overwrites URL/timestamp.
export async function addDistribution(
  input: AddDistributionInput,
): Promise<NewsletterDistribution> {
  const { data, error } = await supabaseAdmin
    .from("newsletter_distributions")
    .upsert(
      {
        issue_id: input.issue_id,
        platform: input.platform,
        external_url: input.external_url ?? null,
        published_at: input.published_at ?? new Date().toISOString(),
        notes: input.notes ?? null,
      },
      { onConflict: "issue_id,platform" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as NewsletterDistribution;
}

// ── Send (Resend broadcast) ───────────────────────────────────────────

const SITE_URL = "https://whatelz.ai";

function markdownToHtml(md: string): string {
  // Minimal markdown → HTML. Full-blown MD rendering happens on the reader
  // page via MDXRemote; email needs simpler, more compatible output.
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(.+)$/, "<p>$1</p>");
}

function issueEmailHtml(
  issue: NewsletterIssue,
  unsubscribeUrl: string,
): string {
  const bodyHtml = markdownToHtml(issue.content);
  const readOnline = `${SITE_URL}/this-week/${issue.slug}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${issue.title}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 2rem 1rem; color: #27272a; line-height: 1.6;">
  <p style="font-family: monospace; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: #a1a1aa;">
    What ELZ This Week? — #${String(issue.issue_number).padStart(3, "0")}
  </p>
  <h1 style="font-size: 1.75rem; margin: 0.5rem 0 0.25rem; color: #09090b;">${issue.title}</h1>
  ${issue.subtitle ? `<p style="font-size: 1.1rem; color: #52525b; margin: 0 0 1.5rem;">${issue.subtitle}</p>` : ""}
  <div style="font-size: 1rem;">${bodyHtml}</div>
  <hr style="margin: 3rem 0 1.5rem; border: none; border-top: 1px solid #e4e4e7;">
  <p style="font-size: 0.8125rem; color: #71717a;">
    <a href="${readOnline}" style="color: #27272a;">Read online</a> · <a href="${unsubscribeUrl}" style="color: #a1a1aa;">Unsubscribe</a>
  </p>
</body>
</html>`;
}

export async function sendIssue(
  id: string,
): Promise<{ sent: number; skipped: number; issue: NewsletterIssue }> {
  const issue = await getIssueById(id);
  if (!issue) throw new Error("issue_not_found");
  if (issue.status === "sent") throw new Error("already_sent");

  const subscribers = await listSubscribers("confirmed");

  const apiKey = process.env.RESEND_API_KEY;
  let sent = 0;
  let skipped = 0;

  if (apiKey && subscribers.length > 0) {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    // Send in serial to keep it dependency-free. Resend supports batch; if
    // the list grows past ~50 we should switch to `resend.batch.send`.
    for (const sub of subscribers) {
      const unsubscribeUrl = `${SITE_URL}/api/newsletter/unsubscribe/${sub.unsubscribe_token}`;
      try {
        await resend.emails.send({
          from: "What ELZ This Week? <weekly@whatelz.ai>",
          to: sub.email,
          subject: `${issue.title} — What ELZ This Week? #${String(issue.issue_number).padStart(3, "0")}`,
          html: issueEmailHtml(issue, unsubscribeUrl),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        sent++;
      } catch (err) {
        console.error(`[newsletter.send] failed for ${sub.email}:`, err);
        skipped++;
      }
    }
  } else if (!apiKey) {
    console.log("[newsletter.send] RESEND_API_KEY not set — dry-run only");
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabaseAdmin
    .from("newsletter_issues")
    .update({ status: "sent", published_at: now, updated_at: now })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Log the resend distribution row with count in notes.
  await addDistribution({
    issue_id: id,
    platform: "resend",
    published_at: now,
    notes: `sent=${sent} skipped=${skipped} total=${subscribers.length}`,
  });

  // Also log whatelz canonical URL as the primary distribution.
  await addDistribution({
    issue_id: id,
    platform: "whatelz",
    external_url: `${SITE_URL}/this-week/${(updated as NewsletterIssue).slug}`,
    published_at: now,
  });

  return { sent, skipped, issue: updated as NewsletterIssue };
}
