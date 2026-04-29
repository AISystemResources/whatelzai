import { listCareer } from '@/lib/career';
import type { CareerEntry } from '@/lib/career';
import { PageShell } from '@/components/shell/PageShell';
import { CareerList } from './_components/CareerList';

export const dynamic = 'force-dynamic';

export default async function CareerPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { highlight } = await searchParams;
  const entries = await listCareer(true);

  // Group by slug, keeping order from first occurrence (sorted start_date DESC)
  const slugOrder: string[] = [];
  const bySlugMap = new Map<string, CareerEntry[]>();
  for (const entry of entries) {
    if (!bySlugMap.has(entry.slug)) {
      slugOrder.push(entry.slug);
      bySlugMap.set(entry.slug, []);
    }
    bySlugMap.get(entry.slug)!.push(entry);
  }

  // Convert Map to plain object for client component
  const bySlug: Record<string, CareerEntry[]> = {};
  for (const [k, v] of bySlugMap) {
    bySlug[k] = v;
  }

  return (
    <PageShell
      title="Career"
      description="Experience across data science, product management, and AI engineering."
    >
      <CareerList slugOrder={slugOrder} bySlug={bySlug} highlight={highlight} />
    </PageShell>
  );
}
