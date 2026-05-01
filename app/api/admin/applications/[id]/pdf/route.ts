import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getApplication } from '@/lib/supabase-jobs';
import { renderCoverLetterPdf } from '@/lib/cover-letter-pdf';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const app = await getApplication(id);
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  if (!app.cover_letter?.trim()) {
    return NextResponse.json({ error: 'No cover letter to render — draft one first' }, { status: 400 });
  }

  const companyName = (app.job_listings as { company?: string } | null)?.company;

  const buffer = await renderCoverLetterPdf(app.cover_letter, companyName);

  const path = `cover-letters/${id}/cover-letter-${Date.now()}.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('resumes')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage.from('resumes').getPublicUrl(path);
  const pdf_url = urlData.publicUrl;

  await supabaseAdmin
    .from('applications')
    .update({ cover_letter_pdf_url: pdf_url, updated_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ pdf_url });
}
