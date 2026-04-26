import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readDoc } from '@/lib/website-docs';
import { listUserProfile } from '@/lib/supabase-jobs';

const client = new Anthropic();

export async function POST(req: Request) {
  const { narrative = 'AI Engineer' } = await req.json() as { narrative?: string };

  const [mystory, profile] = await Promise.all([
    readDoc('MYSTORY'),
    listUserProfile(),
  ]);

  const profileText = profile
    .map(p => `${p.category}/${p.key}: ${p.value}`)
    .join('\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are a professional resume writer. You write concise, impactful resumes for software engineers.
Rules:
- Every fact must come from the provided MYSTORY or profile data. Do not invent anything.
- Lead with one clear narrative thread: "${narrative}".
- Pick the top 3-4 experiences and 5-6 skills that support the narrative. Deprioritise the rest.
- Bullets must start with a strong action verb and include a quantified outcome where the data supports it.
- No "responsible for" or "worked on" — only impact statements.
- Return a JSON object matching this structure exactly:
{
  "summary": "string (2-3 sentences, first person, narrative-first)",
  "skills": ["string", ...],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "period": "string",
      "bullets": ["string", ...],
      "technologies": ["string", ...]
    }
  ],
  "education": [{ "institution": "string", "degree": "string", "period": "string" }],
  "achievements": ["string", ...]
}`,
    messages: [{
      role: 'user',
      content: `MYSTORY:\n${mystory}\n\nPROFILE DATA:\n${profileText}\n\nNarrative angle: ${narrative}\n\nDraft the resume JSON now.`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'ai_parse_failed' }, { status: 500 });
  }

  let structured: object;
  try {
    structured = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: 'ai_parse_failed' }, { status: 500 });
  }

  return NextResponse.json({ structured });
}
