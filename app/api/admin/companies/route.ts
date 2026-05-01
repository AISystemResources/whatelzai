import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('priority')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data });
}

export async function POST(req: Request) {
  const body = await req.json() as {
    name: string; industry?: string; ats_type?: string;
    ats_slug?: string; careers_url?: string; priority?: number;
  };
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({ ...body, source: 'manual' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data }, { status: 201 });
}
