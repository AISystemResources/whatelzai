import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
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
import { listDashboardCards, upsertDashboardCard } from "@/lib/dashboard-cards";
import {
  listPublicTestimonials,
  listAllTestimonials,
  getTestimonial,
  setTestimonialHeadline,
} from "@/lib/testimonials";
import { listActiveOffers } from "@/lib/offers";
import { listHackathons } from "@/lib/hackathons";
import { listServiceEvents } from "@/lib/service-events";

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

  // Testimonials — pure-data reads. Server never summarises or drafts.
  "testimonials.list_public": async () => listPublicTestimonials(),
  "testimonials.list_all": async () => listAllTestimonials(),
  "testimonials.get": (a) => getTestimonial(a.id as string),
  "testimonials.set_headline": (a) =>
    setTestimonialHeadline(a.id as string, a.headline as string),

  // Offers + hackathons + events — read-only surfaces for briefings.
  "offers.list_active": async () => listActiveOffers(),
  "hackathons.list": async (a) =>
    listHackathons((a.published_only as boolean | undefined) ?? true),
  "service_events.list": async () => listServiceEvents(),

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
    name: "describe_tools",
    description:
      "Return the full tool catalogue (same shape as tools/list, plus descriptions) for callers without MCP introspection.",
    inputSchema: { type: "object", properties: {} },
  },
];

async function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const { data } = await supabaseAdmin
    .from("system_config")
    .select("value")
    .eq("key", "mcp_token")
    .single();
  if (!data?.value || token !== data.value) {
    const url = new URL(req.url);
    const resourceMetadata = `${url.protocol}//${url.host}/api/mcp/whatelz/.well-known/oauth-protected-resource`;
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" } },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer realm="whatelz-mcp", resource_metadata="${resourceMetadata}"`,
        },
      },
    );
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authFail = await checkAuth(req);
  if (authFail) return authFail;

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
      const result = await handler(args);
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
