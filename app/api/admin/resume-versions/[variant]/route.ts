import { NextRequest, NextResponse } from 'next/server';
import { getResumeVersion, upsertResumeVersion } from '@/lib/resume-versions';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  const version = await getResumeVersion(decodeURIComponent(variant));
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ version });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  const { content } = await req.json() as { content: string };
  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }
  const version = await upsertResumeVersion(decodeURIComponent(variant), content);
  return NextResponse.json({ version });
}
