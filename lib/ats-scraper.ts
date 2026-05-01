export interface RawListing {
  readonly external_id: string;
  readonly external_url: string;
  readonly company: string;
  readonly role: string;
  readonly location: string | null;
  readonly remote_type: 'onsite' | 'hybrid' | 'remote' | null;
  readonly description: string | null;
  readonly posted_at: string | null;
}

export async function scrapeGreenhouse(slug: string, companyName: string): Promise<RawListing[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
    headers: { 'User-Agent': 'whatelz-job-hunter/1.0' },
  });
  if (!res.ok) return [];
  const data = await res.json() as { jobs?: unknown[] };
  return ((data.jobs ?? []) as Record<string, unknown>[]).map(j => ({
    external_id:  String(j['id']),
    external_url: (j['absolute_url'] as string | undefined) ?? `https://boards.greenhouse.io/${slug}/jobs/${j['id']}`,
    company:      companyName,
    role:         (j['title'] as string | undefined) ?? '',
    location:     ((j['location'] as Record<string, string> | undefined)?.['name']) ?? null,
    remote_type:  detectRemote(((j['location'] as Record<string, string> | undefined)?.['name']) ?? null),
    description:  (j['content'] as string | undefined) ?? null,
    posted_at:    (j['updated_at'] as string | undefined) ?? null,
  }));
}

export async function scrapeLever(slug: string, companyName: string): Promise<RawListing[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
    headers: { 'User-Agent': 'whatelz-job-hunter/1.0' },
  });
  if (!res.ok) return [];
  const data = await res.json() as unknown[];
  return (Array.isArray(data) ? data as Record<string, unknown>[] : []).map(j => ({
    external_id:  (j['id'] as string | undefined) ?? '',
    external_url: (j['hostedUrl'] as string | undefined) ?? `https://jobs.lever.co/${slug}/${j['id']}`,
    company:      companyName,
    role:         (j['text'] as string | undefined) ?? '',
    location:     ((j['categories'] as Record<string, string> | undefined)?.['location']) ?? null,
    remote_type:  detectRemote(((j['categories'] as Record<string, string> | undefined)?.['commitment']) ?? null),
    description:  (j['descriptionPlain'] as string | undefined) ?? null,
    posted_at:    (j['createdAt'] as number | undefined)
      ? new Date(j['createdAt'] as number).toISOString()
      : null,
  }));
}

export async function scrapeAshby(slug: string, companyName: string): Promise<RawListing[]> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'whatelz-job-hunter/1.0' },
    body: JSON.stringify({}),
  });
  if (!res.ok) return [];
  const data = await res.json() as { jobPostings?: Record<string, unknown>[] };
  return (data.jobPostings ?? []).map(j => ({
    external_id:  (j['id'] as string | undefined) ?? '',
    external_url: (j['jobUrl'] as string | undefined) ?? '',
    company:      companyName,
    role:         (j['title'] as string | undefined) ?? '',
    location:     (j['locationName'] as string | undefined) ?? null,
    remote_type:  (j['isRemote'] as boolean | undefined) ? 'remote' : 'onsite',
    description:  ((j['descriptionHtml'] as string | undefined)?.replace(/<[^>]+>/g, '')) ?? null,
    posted_at:    (j['publishedDate'] as string | undefined) ?? null,
  }));
}

function detectRemote(text: string | null | undefined): 'onsite' | 'hybrid' | 'remote' | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes('remote')) return 'remote';
  if (t.includes('hybrid')) return 'hybrid';
  if (t.includes('on-site') || t.includes('onsite') || t.includes('office')) return 'onsite';
  return null;
}

export async function scrapeCompany(
  atsType: string | null,
  atsSlug: string | null,
  companyName: string,
): Promise<RawListing[]> {
  if (!atsType || !atsSlug) return [];
  switch (atsType.toLowerCase()) {
    case 'greenhouse': return scrapeGreenhouse(atsSlug, companyName);
    case 'lever':      return scrapeLever(atsSlug, companyName);
    case 'ashby':      return scrapeAshby(atsSlug, companyName);
    default:           return [];
  }
}
