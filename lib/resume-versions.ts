import { supabaseAdmin } from './supabase-server';

export type ResumeVersion = {
  id: string;
  variant: string;
  content: string;
  pdf_url: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
};


export async function listResumeVersions(): Promise<ResumeVersion[]> {
  const { data, error } = await supabaseAdmin
    .from('resume_versions')
    .select('*')
    .order('variant');
  if (error) throw new Error(`listResumeVersions: ${error.message}`);
  return (data ?? []) as ResumeVersion[];
}

export async function getResumeVersion(variant: string): Promise<ResumeVersion | null> {
  const { data, error } = await supabaseAdmin
    .from('resume_versions')
    .select('*')
    .eq('variant', variant)
    .maybeSingle();
  if (error) throw new Error(`getResumeVersion: ${error.message}`);
  return data as ResumeVersion | null;
}

export async function upsertResumeVersion(
  variant: string,
  content: string,
): Promise<ResumeVersion> {
  const { data, error } = await supabaseAdmin
    .from('resume_versions')
    .upsert(
      { variant, content, updated_at: new Date().toISOString() },
      { onConflict: 'variant' },
    )
    .select()
    .single();
  if (error) throw new Error(`upsertResumeVersion: ${error.message}`);
  return data as ResumeVersion;
}

export async function setResumeVersionPdf(
  variant: string,
  pdf_url: string,
  pdf_path: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('resume_versions')
    .update({ pdf_url, pdf_path, updated_at: new Date().toISOString() })
    .eq('variant', variant);
  if (error) throw new Error(`setResumeVersionPdf: ${error.message}`);
}
