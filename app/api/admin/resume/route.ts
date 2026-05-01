import { NextResponse } from 'next/server';
import { listResumes, saveResume } from '@/lib/supabase-jobs';
import type { ResumeStructured } from '@/lib/types/jobs';

export async function GET() {
  const resumes = await listResumes();
  return NextResponse.json({ resumes });
}

export async function POST(req: Request) {
  const { label, raw_text, structured } = await req.json() as {
    label: string;
    raw_text: string;
    structured: ResumeStructured;
  };
  if (!label || !raw_text || !structured) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  const resume = await saveResume(label, raw_text, structured);
  return NextResponse.json({ resume }, { status: 201 });
}
