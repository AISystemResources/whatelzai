import { NextRequest, NextResponse } from "next/server";
import { findActiveToken, touchTokenUsage } from "@/lib/auth/tokens";
import { matchesScope } from "@/lib/auth/scopes";
import { recordAudit } from "@/lib/auth/audit";
import { checkTokenRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  listDocs,
  listSections,
  readSection,
  readDoc,
  createSection,
  appendSection,
  patchSection,
  renameSection,
  moveSection,
  deleteSection,
  listRecentChanges,
  VALID_SLUGS,
} from "@/lib/website-docs";
import {
  listDashboardCards,
  upsertDashboardCard,
  deleteDashboardCard,
} from "@/lib/dashboard-cards";
import {
  listPublicTestimonials,
  listAllTestimonials,
  getTestimonial,
  setTestimonialHeadline,
  setTestimonialFeatured,
  setTestimonialKeywords,
  getAggregateKeywords,
} from "@/lib/testimonials";
import { listActiveOffers } from "@/lib/offers";
import { listHackathons } from "@/lib/hackathons";
import { listServiceEvents } from "@/lib/service-events";
import {
  listLandingSections,
  getLandingSection,
  upsertLandingSection,
  type SectionKey,
} from "@/lib/landing-content";
import {
  listServices,
  getServiceBySlug,
  upsertService,
  deleteService,
  type Service,
} from "@/lib/services";
import {
  listIssues,
  getIssueBySlug,
  createIssue,
  updateIssue,
  sendIssue,
  listSubscribers,
  subscriberStats,
  addDistribution,
  listDistributions,
  type DistributionPlatform,
} from "@/lib/newsletter";
import { getSelfMetrics } from "@/lib/cockpit-self";
import { fetchRemoteWidgets } from "@/lib/cockpit";

type ToolArgs = Record<string, unknown>;

const TOOLS: Record<string, (args: ToolArgs) => Promise<unknown>> = {
  list_docs: async () => listDocs(),
  list_sections: (a) =>
    listSections(a.doc_slug as (typeof VALID_SLUGS)[number]),
  read_section: (a) =>
    readSection(
      a.doc_slug as (typeof VALID_SLUGS)[number],
      a.heading as string,
    ),
  read_doc: (a) => readDoc(a.doc_slug as (typeof VALID_SLUGS)[number]),
  create_section: (a) =>
    createSection(
      a.doc_slug as (typeof VALID_SLUGS)[number],
      a.heading as string,
      a.content as string,
      a.position as number | undefined,
    ),
  append_section: (a) =>
    appendSection(
      a.doc_slug as (typeof VALID_SLUGS)[number],
      a.heading as string,
      a.content as string,
      (a.create_if_missing as boolean | undefined) ?? true,
    ),
  patch_section: (a) =>
    patchSection(
      a.doc_slug as (typeof VALID_SLUGS)[number],
      a.heading as string,
      a.content as string,
      a.expected_version as number,
      a.captured_by as string | undefined,
    ),
  rename_section: (a) =>
    renameSection(
      a.doc_slug as (typeof VALID_SLUGS)[number],
      a.heading as string,
      a.new_heading as string,
      a.expected_version as number,
    ),
  move_section: (a) =>
    moveSection(
      a.doc_slug as (typeof VALID_SLUGS)[number],
      a.heading as string,
      a.new_position as number,
      a.expected_version as number,
    ),
  delete_section: (a) =>
    deleteSection(
      a.doc_slug as (typeof VALID_SLUGS)[number],
      a.heading as string,
      a.expected_version as number,
    ),
  list_recent_changes: (a) =>
    listRecentChanges(
      a.doc_slug as (typeof VALID_SLUGS)[number] | undefined,
      (a.limit as number | undefined) ?? 20,
    ),

  // Dashboard cards — briefing write-back surface for Claude Schedule runs.
  // Pure data verbs: server never generates body_markdown. Claude in the
  // client produces the body; this just persists + reads.
  "dashboard.list_cards": async () => listDashboardCards(),
  "dashboard.upsert_card": (a) =>
    upsertDashboardCard({
      key: a.key as string,
      title: a.title as string,
      body_markdown: a.body_markdown as string,
      meta: a.meta as Record<string, unknown> | undefined,
      source: a.source as string | undefined,
      expected_cadence_hours: a.expected_cadence_hours as number | undefined,
    }),
  "dashboard.delete_card": (a) => deleteDashboardCard(a.key as string),

  // Testimonials — pure-data reads. Server never summarises or drafts.
  "testimonials.list_public": async () => listPublicTestimonials(),
  "testimonials.list_all": async () => listAllTestimonials(),
  "testimonials.get": (a) => getTestimonial(a.id as string),
  "testimonials.set_headline": (a) =>
    setTestimonialHeadline(a.id as string, a.headline as string),
  "testimonials.set_featured": (a) =>
    setTestimonialFeatured(a.id as string, a.featured as boolean),
  "testimonials.set_keywords": (a) =>
    setTestimonialKeywords(a.id as string, a.keywords as string[]),
  "testimonials.aggregate_keywords": (a) =>
    getAggregateKeywords((a.limit as number | undefined) ?? 5),

  // Services catalogue — the /services surface. `services.upsert` is the
  // primary way to edit complex nested pricing (founding block, tiers).
  "services.list_all": async () => listServices(false),
  "services.get_by_slug": (a) => getServiceBySlug(a.slug as string),
  "services.upsert": (a) =>
    upsertService(
      a.fields as Partial<Service> & {
        slug: string;
        name: string;
        category: string;
      },
    ),
  "services.delete": async (a) => {
    await deleteService(a.id as string);
    return { ok: true };
  },

  // Homepage landing sections — chat-driven text edits. Section keys:
  // 'provocation', 'pov', 'track_record', 'training_offer' (which is now
  // the coaching + founding cohort section despite the legacy name).
  "landing.list_sections": async () => listLandingSections(),
  "landing.get_section": (a) => getLandingSection(a.key as SectionKey),
  "landing.update_section": async (a) => {
    await upsertLandingSection(a.key as SectionKey, a.body);
    return { ok: true };
  },

  // Offers + hackathons + events — read-only surfaces for briefings.
  "offers.list_active": async () => listActiveOffers(),
  "hackathons.list": async (a) =>
    listHackathons((a.published_only as boolean | undefined) ?? true),
  "service_events.list": async () => listServiceEvents(),

  // Newsletter — What ELZ This Week? Compose, send, log distributions.
  "newsletter.list_issues": async (a) =>
    listIssues((a.include_draft as boolean | undefined) ?? false),
  "newsletter.get_issue": (a) => getIssueBySlug(a.slug as string),
  "newsletter.create_issue": (a) =>
    createIssue({
      slug: a.slug as string,
      title: a.title as string,
      subtitle: a.subtitle as string | undefined,
      summary: a.summary as string | undefined,
      content: a.content as string,
    }),
  "newsletter.update_issue": (a) =>
    updateIssue(a.id as string, {
      slug: a.slug as string | undefined,
      title: a.title as string | undefined,
      subtitle: a.subtitle as string | null | undefined,
      summary: a.summary as string | null | undefined,
      content: a.content as string | undefined,
    }),
  "newsletter.send_issue": async (a) => sendIssue(a.id as string),
  "newsletter.list_subscribers": async () => listSubscribers("confirmed"),
  "newsletter.subscriber_stats": async () => subscriberStats(),
  "newsletter.list_distributions": (a) =>
    listDistributions(a.issue_id as string),
  "newsletter.add_distribution": (a) =>
    addDistribution({
      issue_id: a.issue_id as string,
      platform: a.platform as DistributionPlatform,
      external_url: a.external_url as string | undefined,
      published_at: a.published_at as string | undefined,
      notes: a.notes as string | undefined,
    }),

  // Command Center snapshot — same data the /admin/command-center page renders.
  // scope: 'self' (default) returns whatelz.ai only. 'all' proxies EMDEE +
  // DoubleLead owner-metrics endpoints too using the server-side tokens.
  "system.metrics": async (a) => {
    const scope = (a.scope as string | undefined) ?? "self";
    if (scope === "self") {
      return { whatelz: await getSelfMetrics() };
    }
    const [self, remote] = await Promise.all([
      getSelfMetrics(),
      fetchRemoteWidgets(),
    ]);
    return {
      whatelz: self,
      emdee: remote.emdee,
      doublelead: remote.doublelead,
    };
  },

  describe_tools: async () => ({ tools: TOOL_SCHEMAS }),
};

const TOOL_SCHEMAS = [
  {
    name: "list_docs",
    description:
      "List the 6 Whatelz doc slugs with their current section count and most recent updated_at.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_sections",
    description:
      "List headings, positions, versions, content previews for a doc",
    inputSchema: {
      type: "object",
      required: ["doc_slug"],
      properties: { doc_slug: { type: "string", enum: VALID_SLUGS } },
    },
  },
  {
    name: "read_section",
    description:
      "Read a section's full content + version. Store the version for patch_section.",
    inputSchema: {
      type: "object",
      required: ["doc_slug", "heading"],
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        heading: { type: "string" },
      },
    },
  },
  {
    name: "read_doc",
    description: "Read the entire doc as one assembled markdown blob",
    inputSchema: {
      type: "object",
      required: ["doc_slug"],
      properties: { doc_slug: { type: "string", enum: VALID_SLUGS } },
    },
  },
  {
    name: "create_section",
    description: "Create a new section. Fails on duplicate heading.",
    inputSchema: {
      type: "object",
      required: ["doc_slug", "heading", "content"],
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        heading: { type: "string" },
        content: { type: "string" },
        position: { type: "integer", minimum: 0 },
      },
    },
  },
  {
    name: "append_section",
    description: "Append markdown to a section; creates it if missing.",
    inputSchema: {
      type: "object",
      required: ["doc_slug", "heading", "content"],
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        heading: { type: "string" },
        content: { type: "string" },
        create_if_missing: { type: "boolean", default: true },
      },
    },
  },
  {
    name: "patch_section",
    description: "Replace a section's content. Requires expected_version.",
    inputSchema: {
      type: "object",
      required: ["doc_slug", "heading", "content", "expected_version"],
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        heading: { type: "string" },
        content: { type: "string" },
        expected_version: { type: "integer", minimum: 1 },
      },
    },
  },
  {
    name: "rename_section",
    description:
      "Rename a section. Requires expected_version. Fails on duplicate heading.",
    inputSchema: {
      type: "object",
      required: ["doc_slug", "heading", "new_heading", "expected_version"],
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        heading: { type: "string" },
        new_heading: { type: "string" },
        expected_version: { type: "integer", minimum: 1 },
      },
    },
  },
  {
    name: "move_section",
    description:
      "Reorder a section. Insert-at-N semantics. Requires expected_version.",
    inputSchema: {
      type: "object",
      required: ["doc_slug", "heading", "new_position", "expected_version"],
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        heading: { type: "string" },
        new_position: { type: "integer", minimum: 0 },
        expected_version: { type: "integer", minimum: 1 },
      },
    },
  },
  {
    name: "delete_section",
    description:
      "Soft-delete a section. Row + history preserved. Requires expected_version.",
    inputSchema: {
      type: "object",
      required: ["doc_slug", "heading", "expected_version"],
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        heading: { type: "string" },
        expected_version: { type: "integer", minimum: 1 },
      },
    },
  },
  {
    name: "list_recent_changes",
    description: "See what was edited recently across all docs.",
    inputSchema: {
      type: "object",
      properties: {
        doc_slug: { type: "string", enum: VALID_SLUGS },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    },
  },
  {
    name: "dashboard.list_cards",
    description:
      "List all dashboard briefing cards, most recently updated first. Read-only.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "dashboard.upsert_card",
    description:
      "Write or overwrite a briefing card by key. Body markdown is produced by Claude in the client; this verb never generates content — it only persists what it receives. Set expected_cadence_hours so the UI can flag the card stale if the next update doesn't arrive on time.",
    inputSchema: {
      type: "object",
      required: ["key", "title", "body_markdown"],
      properties: {
        key: {
          type: "string",
          description:
            "Stable identifier, e.g. 'morning-briefing' or 'doublelead-dau'. Upserts overwrite.",
        },
        title: { type: "string" },
        body_markdown: {
          type: "string",
          description: "Markdown body. Rendered on /admin.",
        },
        meta: {
          type: "object",
          description: "Free-form structured payload. Opaque to the UI.",
        },
        source: {
          type: "string",
          description:
            "Which agent/schedule wrote this card. Helps trace bad briefings.",
        },
        expected_cadence_hours: {
          type: "integer",
          minimum: 1,
          description:
            "Cadence the writer promises. UI flags stale when now() > updated_at + this. Omit for cards that don't have a cadence.",
        },
      },
    },
  },
  {
    name: "dashboard.delete_card",
    description:
      "Prune a briefing card by key. Returns { deleted: boolean } — false if no card matched. Use to kill experiments that aren't earning their spot on /admin.",
    inputSchema: {
      type: "object",
      required: ["key"],
      properties: {
        key: {
          type: "string",
          description: "Stable identifier of the card to remove.",
        },
      },
    },
  },
  {
    name: "testimonials.list_public",
    description:
      "Read all published + approved testimonials (the ones live on the site). Includes quote, author info, category, socials, outcome tag.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "testimonials.list_all",
    description:
      "Read every testimonial regardless of status (incomplete/pending/approved/rejected). Includes draft and moderation state — use for briefings on what needs Edmund's attention.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "testimonials.get",
    description:
      "Read one testimonial by id — returns full context including all quote_answers and admin/improvement notes.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    },
  },
  {
    name: "testimonials.set_headline",
    description:
      "Persist a one-liner editorial headline for a testimonial. Displayed as the card title on /testimonials. Never rewrites the raw quote or quote_answers — distill their voice, don't fabricate. Refuses rows with status='incomplete' (those have live email tokens tied to the raw prefill).",
    inputSchema: {
      type: "object",
      required: ["id", "headline"],
      properties: {
        id: { type: "string" },
        headline: {
          type: "string",
          description:
            "Short summary, ideally 40-80 chars. Pass empty string to clear.",
        },
      },
    },
  },
  {
    name: "testimonials.set_featured",
    description:
      "Toggle whether a testimonial appears on the homepage marquee. Unfeatured rows still appear on /testimonials — only the homepage set shrinks. Use for editorial curation. Refuses rows with status='incomplete'.",
    inputSchema: {
      type: "object",
      required: ["id", "featured"],
      properties: {
        id: { type: "string" },
        featured: { type: "boolean" },
      },
    },
  },
  {
    name: "testimonials.set_keywords",
    description:
      "Curate the keyword tags (character / capability / impact) for one testimonial. Displayed as pill tags on the individual testimonial page, aggregated across published rows for the /testimonials header. Stopwords to avoid: 'AI', 'Edmund', framing verbs ('work', 'workshop', 'session', 'training', 'mentor'), filler adjectives ('great', 'nice', 'good'). Keep: character traits ('perseverance', 'curious', 'patient'), capabilities ('teaches', 'ships', 'AI-native'), impact ('clarity', 'confidence', 'momentum'). Aim for 3-5 keywords per testimonial. Refuses rows with status='incomplete'.",
    inputSchema: {
      type: "object",
      required: ["id", "keywords"],
      properties: {
        id: { type: "string" },
        keywords: {
          type: "array",
          items: { type: "string" },
          minItems: 0,
          maxItems: 10,
        },
      },
    },
  },
  {
    name: "testimonials.aggregate_keywords",
    description:
      "Return the most-frequent keywords across all published testimonials. Powers the /testimonials header 'words people use most about Edmund' display. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
      },
    },
  },
  {
    name: "services.list_all",
    description:
      "List every service (published + unpublished). Includes full pricing + founding block + deliverables + status. Sort by sort_order ascending, nullsFirst=false.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "services.get_by_slug",
    description:
      "Fetch one service by slug (e.g. 'ai-mentor-1-1'). Returns null if not found.",
    inputSchema: {
      type: "object",
      required: ["slug"],
      properties: { slug: { type: "string" } },
    },
  },
  {
    name: "services.upsert",
    description:
      "Create or replace a service row (upsert on slug). Pass the full fields object — id, slug, name, category are required (upsertService throws otherwise). Nested pricing shape: { currency, tiers: [{id,label,amount,unit,note?}], founding?: { expires_after_engagements?, trade?, public?, tiers: [...] } }. Use for complex pricing edits that the admin form doesn't handle well.",
    inputSchema: {
      type: "object",
      required: ["fields"],
      properties: {
        fields: {
          type: "object",
          required: ["slug", "name", "category"],
          properties: {
            id: { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            category: { type: "string" },
            tagline: { type: "string" },
            description: { type: "string" },
            audience: { type: "string" },
            pricing_model: { type: "string" },
            pricing: { type: "object" },
            deliverables: { type: "array", items: { type: "string" } },
            terms: { type: "object" },
            cta_label: { type: "string" },
            cta_url: { type: "string" },
            proof: { type: "string" },
            status: {
              type: "string",
              enum: ["live", "coming_soon", "private", "retired"],
            },
            featured: { type: "boolean" },
            published: { type: "boolean" },
            sort_order: { type: "integer" },
            content: { type: "string" },
          },
        },
      },
    },
  },
  {
    name: "services.delete",
    description:
      "Permanently remove a service row. Pass the UUID id (not slug). Irreversible — no soft-delete.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    },
  },
  {
    name: "landing.list_sections",
    description:
      "List every landing_content row (homepage section keys + current bodies + published state). Section keys today: 'provocation', 'pov', 'track_record', 'training_offer' (which is now the coaching + founding cohort section despite the legacy name).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "landing.get_section",
    description:
      "Read one landing_content section by key — returns the current DB body regardless of published state (for editing).",
    inputSchema: {
      type: "object",
      required: ["key"],
      properties: {
        key: {
          type: "string",
          enum: ["provocation", "pov", "track_record", "training_offer"],
        },
      },
    },
  },
  {
    name: "landing.update_section",
    description:
      "Upsert the JSON body for a landing_content section. Pass the full new body — this is a replace, not a merge. Use `landing.get_section` first to see the current shape.",
    inputSchema: {
      type: "object",
      required: ["key", "body"],
      properties: {
        key: {
          type: "string",
          enum: ["provocation", "pov", "track_record", "training_offer"],
        },
        body: {
          type: "object",
          description:
            "Full section body — see each section's TS interface in lib/landing-content.ts",
        },
      },
    },
  },
  {
    name: "offers.list_active",
    description:
      "Read all active stripe_offers rows — the catalog of things for sale (memberships, cohorts, one-offs). Read-only.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "hackathons.list",
    description:
      "Read hackathons. By default only published rows. Use for building briefings about competition activity.",
    inputSchema: {
      type: "object",
      properties: {
        published_only: {
          type: "boolean",
          default: true,
          description: "If false, include unpublished/draft hackathons.",
        },
      },
    },
  },
  {
    name: "service_events.list",
    description:
      "Read the training / mentorship / hackathon events that testimonials can attribute to. Read-only.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "newsletter.list_issues",
    description:
      "List newsletter issues. Defaults to sent-only; pass include_draft=true for admin views.",
    inputSchema: {
      type: "object",
      properties: { include_draft: { type: "boolean", default: false } },
    },
  },
  {
    name: "newsletter.get_issue",
    description: "Fetch a single issue by slug (any status).",
    inputSchema: {
      type: "object",
      required: ["slug"],
      properties: { slug: { type: "string" } },
    },
  },
  {
    name: "newsletter.create_issue",
    description:
      "Draft a new issue. issue_number is auto-assigned (max + 1). Status is 'draft' until send_issue is called.",
    inputSchema: {
      type: "object",
      required: ["slug", "title", "content"],
      properties: {
        slug: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        summary: { type: "string" },
        content: { type: "string" },
      },
    },
  },
  {
    name: "newsletter.update_issue",
    description:
      "Update fields on an existing issue. Sent issues can still be updated but the change won't be re-broadcast.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        slug: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        summary: { type: "string" },
        content: { type: "string" },
      },
    },
  },
  {
    name: "newsletter.send_issue",
    description:
      "Send a draft issue to all confirmed subscribers via Resend, mark it sent, log distributions for whatelz + resend. Idempotency: fails if already sent.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    },
  },
  {
    name: "newsletter.list_subscribers",
    description: "List confirmed subscribers (admin-only surface).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "newsletter.subscriber_stats",
    description:
      "Return { confirmed, unsubscribed, total } counts for the newsletter list.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "newsletter.list_distributions",
    description:
      "List cross-post distribution rows (platform + URL + timestamp) for an issue.",
    inputSchema: {
      type: "object",
      required: ["issue_id"],
      properties: { issue_id: { type: "string" } },
    },
  },
  {
    name: "newsletter.add_distribution",
    description:
      "Log a cross-post URL for an issue. Upsert on (issue_id, platform). Platforms: whatelz, resend, linkedin, medium, substack, beehiiv.",
    inputSchema: {
      type: "object",
      required: ["issue_id", "platform"],
      properties: {
        issue_id: { type: "string" },
        platform: {
          type: "string",
          enum: [
            "whatelz",
            "resend",
            "linkedin",
            "medium",
            "substack",
            "beehiiv",
          ],
        },
        external_url: { type: "string" },
        published_at: { type: "string" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "system.metrics",
    description:
      "Command Center snapshot — same data the /admin/command-center page renders. Pass scope='self' (default) for whatelz.ai only, or scope='all' to also proxy EMDEE + DoubleLead owner-metrics (returns { whatelz, emdee, doublelead }; remote widgets carry status 'available' | 'pending' | 'error').",
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string", enum: ["self", "all"], default: "self" },
      },
    },
  },
  {
    name: "describe_tools",
    description:
      "Return the full tool catalogue (same shape as tools/list, plus descriptions) for callers without MCP introspection.",
    inputSchema: { type: "object", properties: {} },
  },
];

// Per-verb scope mapping. Every write verb requires a resource:write scope;
// every read verb requires a resource:read scope. Wildcards (`blog:*`, `*`)
// satisfy narrower scopes. `initialize`, `tools/list`, and `describe_tools`
// are introspection-only and require only a valid (any-scope) token.
const TOOL_SCOPES: Record<string, string> = {
  // website-docs
  list_docs: "docs:read",
  list_sections: "docs:read",
  read_section: "docs:read",
  read_doc: "docs:read",
  list_recent_changes: "docs:read",
  create_section: "docs:write",
  append_section: "docs:write",
  patch_section: "docs:write",
  rename_section: "docs:write",
  move_section: "docs:write",
  delete_section: "docs:write",
  // dashboard
  "dashboard.list_cards": "dashboard:read",
  "dashboard.upsert_card": "dashboard:write",
  "dashboard.delete_card": "dashboard:write",
  // testimonials
  "testimonials.list_public": "testimonials:read",
  "testimonials.list_all": "testimonials:read",
  "testimonials.get": "testimonials:read",
  "testimonials.aggregate_keywords": "testimonials:read",
  "testimonials.set_headline": "testimonials:write",
  "testimonials.set_keywords": "testimonials:write",
  "testimonials.set_featured": "testimonials:feature",
  // services
  "services.list_all": "services:read",
  "services.get_by_slug": "services:read",
  "services.upsert": "services:write",
  "services.delete": "services:delete",
  // landing sections
  "landing.list_sections": "sections:read",
  "landing.get_section": "sections:read",
  "landing.update_section": "sections:write",
  // read-only surfaces
  "offers.list_active": "offers:read",
  "hackathons.list": "hackathons:read",
  "service_events.list": "events:read",
  // newsletter
  "newsletter.list_issues": "newsletter:read",
  "newsletter.get_issue": "newsletter:read",
  "newsletter.create_issue": "newsletter:write",
  "newsletter.update_issue": "newsletter:write",
  "newsletter.send_issue": "newsletter:send",
  "newsletter.list_subscribers": "newsletter:subscribers:read",
  "newsletter.subscriber_stats": "newsletter:subscribers:read",
  "newsletter.list_distributions": "newsletter:read",
  "newsletter.add_distribution": "newsletter:write",
  // command center
  "system.metrics": "system:read",
};

// Verbs whose success we push to audit_log. Reads are omitted — audit is
// meant for "who changed what" not "who read what."
const WRITE_VERBS = new Set([
  "create_section",
  "append_section",
  "patch_section",
  "rename_section",
  "move_section",
  "delete_section",
  "dashboard.upsert_card",
  "dashboard.delete_card",
  "testimonials.set_headline",
  "testimonials.set_keywords",
  "testimonials.set_featured",
  "services.upsert",
  "services.delete",
  "landing.update_section",
  "newsletter.create_issue",
  "newsletter.update_issue",
  "newsletter.send_issue",
  "newsletter.add_distribution",
]);

function unauthorized(req: NextRequest, message: string) {
  const url = new URL(req.url);
  const resourceMetadata = `${url.protocol}//${url.host}/api/mcp/whatelz/.well-known/oauth-protected-resource`;
  return NextResponse.json(
    { jsonrpc: "2.0", error: { code: -32001, message } },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer realm="whatelz-mcp", resource_metadata="${resourceMetadata}"`,
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(\S+)$/.exec(authHeader);
  if (!bearer) return unauthorized(req, "missing_bearer_token");

  const token = await findActiveToken(bearer[1]);
  if (!token) return unauthorized(req, "invalid_token");

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  const limit = checkTokenRateLimit(token.id, ip, token.rate_limit_tier);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32005,
          message: "rate_limited",
          data: { reset_at: new Date(limit.resetMs).toISOString() },
        },
      },
      { status: 429 },
    );
  }

  void touchTokenUsage(token.id);

  const body = await req.json().catch(() => null);
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: body?.id ?? null,
        error: { code: -32600, message: "Invalid Request" },
      },
      { status: 400 },
    );
  }

  const { id, method, params } = body;

  try {
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "whatelz", version: "1.0.0" },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { tools: TOOL_SCHEMAS },
      });
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params;
      const handler = TOOLS[name];
      if (!handler) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Tool not found: ${name}` },
        });
      }

      // Scope check. `describe_tools` is introspection-only — any active
      // token can hit it; everything else requires the mapped scope.
      const requiredScope = TOOL_SCOPES[name];
      if (requiredScope && !matchesScope(requiredScope, token.scopes)) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32001,
            message: `missing_scope:${requiredScope}`,
          },
        });
      }

      const result = await handler(args);

      if (WRITE_VERBS.has(name)) {
        void recordAudit({
          tokenId: token.id,
          actorType: "token",
          actorId: token.id,
          action: name,
          resourceType: "mcp_verb",
          resourceId: name,
          ip,
          userAgent,
        });
      }

      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
      });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, Mcp-Session-Id",
    },
  });
}
