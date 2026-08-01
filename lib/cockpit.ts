// Command Center — cross-product metrics aggregator.
// Reads each product's /api/internal/owner-metrics endpoint with a short
// timeout + graceful degradation. If a product is down/misconfigured, its
// widget renders 'unavailable' — the page always loads.
//
// Contract for owner-metrics response is defined in SPRINT-103 spec. Any
// field can be null; whatelz.ai side never crashes on missing data.

const DEFAULT_TIMEOUT_MS = 2500;

export type ProductKey = "whatelz" | "emdee" | "doublelead";

export interface OwnerMetrics {
  product: ProductKey | string;
  generated_at: string;
  schema_version: number;
  business: {
    dau: number | null;
    wau: number | null;
    mau: number | null;
    arr_usd: number | null;
    signups_7d: number | null;
    churn_30d: number | null;
    active_workspaces: number | null;
  };
  usage: Record<string, number | null>;
  product_health: {
    uptime_pct_24h: number | null;
    error_rate_24h: number | null;
    latest_deploy_sha: string | null;
    npm_version: string | null;
  };
}

// State a widget renders. 'available' = we got the payload. 'pending' = the
// remote endpoint isn't configured yet (we haven't shipped that side).
// 'error' = we tried and it failed.
export type WidgetState<T> =
  | { status: "available"; data: T; fetched_at: string }
  | { status: "pending"; reason: string }
  | { status: "error"; reason: string };

interface RemoteConfig {
  key: ProductKey;
  origin: string | undefined;
  token: string | undefined;
  label: string;
}

const REMOTES: RemoteConfig[] = [
  {
    key: "emdee",
    origin: process.env.EMDEE_ORIGIN,
    token: process.env.EMDEE_OWNER_METRICS_TOKEN,
    label: "EMDEE",
  },
  {
    key: "doublelead",
    origin: process.env.DOUBLELEAD_ORIGIN,
    token: process.env.DOUBLELEAD_OWNER_METRICS_TOKEN,
    label: "DoubleLead",
  },
];

async function fetchRemote(
  config: RemoteConfig,
): Promise<WidgetState<OwnerMetrics>> {
  if (!config.origin || !config.token) {
    return {
      status: "pending",
      reason: `Set ${config.key.toUpperCase()}_ORIGIN + ${config.key.toUpperCase()}_OWNER_METRICS_TOKEN in Vercel env`,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.origin}/api/internal/owner-metrics`, {
      method: "GET",
      headers: { Authorization: `Bearer ${config.token}` },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        status: "error",
        reason: `${res.status} ${res.statusText}`,
      };
    }
    const data = (await res.json()) as OwnerMetrics;
    return {
      status: "available",
      data,
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timer);
    const msg =
      (err as Error).name === "AbortError"
        ? `timeout after ${DEFAULT_TIMEOUT_MS}ms`
        : (err as Error).message;
    return { status: "error", reason: msg };
  }
}

// Fetches all remote products in parallel. Each renders independently —
// slow/failed one doesn't hold up others.
export async function fetchRemoteWidgets(): Promise<
  Record<ProductKey, WidgetState<OwnerMetrics>>
> {
  const results = await Promise.all(
    REMOTES.map(async (r) => [r.key, await fetchRemote(r)] as const),
  );
  const map = Object.fromEntries(results) as Record<
    ProductKey,
    WidgetState<OwnerMetrics>
  >;
  // whatelz key is set by the caller (local aggregator). Return only remotes.
  return map;
}
