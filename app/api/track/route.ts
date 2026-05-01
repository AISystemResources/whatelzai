import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const device_id = (body as { device_id?: unknown })?.device_id;
  if (typeof device_id !== 'string' || !UUID_RE.test(device_id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await supabaseAdmin.rpc('track_visitor', { did: device_id });

  return NextResponse.json({ ok: true });
}
