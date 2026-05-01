import { NextResponse } from 'next/server';
import { listApplications } from '@/lib/supabase-jobs';

export async function GET() {
  const applications = await listApplications();
  return NextResponse.json({ applications });
}
