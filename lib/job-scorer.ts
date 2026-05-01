import Anthropic from '@anthropic-ai/sdk';
import { listUserProfile } from './supabase-jobs';

const client = new Anthropic();

export interface ScoreResult {
  readonly match_score: number;
  readonly score_breakdown: Record<string, number>;
  readonly score_reasoning: string;
}

let cachedProfile: string | null = null;

async function getProfileContext(): Promise<string> {
  if (cachedProfile) return cachedProfile;
  const profile = await listUserProfile();
  cachedProfile = profile.map(p => `${p.category}/${p.key}: ${p.value}`).join('\n');
  return cachedProfile;
}

export async function scoreListings(
  listings: Array<{ id: string; role: string; company: string; description: string | null }>,
): Promise<Map<string, ScoreResult>> {
  const profileCtx = await getProfileContext();
  const results = new Map<string, ScoreResult>();

  for (let i = 0; i < listings.length; i += 10) {
    const batch = listings.slice(i, i + 10);
    const jobsText = batch.map((j, idx) =>
      `[${idx}] ${j.company} — ${j.role}\n${(j.description ?? '').slice(0, 800)}`
    ).join('\n\n---\n\n');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a job-fit scorer. Given a candidate profile and job listings, return a JSON array with one object per listing.

CANDIDATE PROFILE:
${profileCtx}

JOBS TO SCORE:
${jobsText}

Return a JSON array with exactly ${batch.length} objects, one per job (same order), each:
{
  "match_score": 0.0-1.0,
  "score_breakdown": { "skills": 0.0-1.0, "experience": 0.0-1.0, "culture": 0.0-1.0, "location": 0.0-1.0 },
  "score_reasoning": "1-2 sentences"
}`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) continue;
    try {
      const scores = JSON.parse(match[0]) as ScoreResult[];
      batch.forEach((j, idx) => { if (scores[idx]) results.set(j.id, scores[idx]); });
    } catch { /* skip malformed batch */ }
  }

  return results;
}
