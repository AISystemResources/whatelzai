import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-server';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif', 'image/webp', 'image/svg+xml',
]);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: storageErr } = await supabaseAdmin.storage
    .from('media')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('media').getPublicUrl(path);

  const { data, error: dbErr } = await supabaseAdmin
    .from('media_assets')
    .insert({
      storage_path: path,
      url:          publicUrl,
      filename:     file.name,
      mime_type:    file.type,
      size_bytes:   file.size,
      label:        file.name.replace(/\.[^.]+$/, ''),
    })
    .select()
    .single();

  if (dbErr) {
    await supabaseAdmin.storage.from('media').remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
