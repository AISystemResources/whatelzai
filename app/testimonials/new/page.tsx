// Legacy path — redirect to the new /feedback/new flow.
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RedirectLegacyNew({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") usp.set(k, v);
    else if (Array.isArray(v) && v[0]) usp.set(k, v[0]);
  }
  const query = usp.toString();
  redirect(`/feedback${query ? `?${query}` : ""}`);
}
