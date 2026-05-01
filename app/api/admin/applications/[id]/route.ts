import { NextResponse } from 'next/server';
import { updateApplicationStatus, updateApplicationDraft } from '@/lib/supabase-jobs';
import type { ApplicationStatus } from '@/lib/types/jobs';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as {
    status?: ApplicationStatus;
    cover_letter?: string;
    resume_bullets?: Record<string, string>[];
  };

  if (body.status) {
    await updateApplicationStatus(id, body.status);
  }
  if (body.cover_letter !== undefined || body.resume_bullets !== undefined) {
    await updateApplicationDraft(id, {
      cover_letter: body.cover_letter,
      resume_bullets: body.resume_bullets,
    });
  }
  return NextResponse.json({ ok: true });
}
