import { supabaseAdmin } from './supabase-server';
import type { Application, ApplicationStatus, JobListing, Resume, UserProfileEntry } from './types/jobs';

export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*, job_listings(company, role, external_url)')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`listApplications: ${error.message}`);
  return (data ?? []) as Application[];
}

export async function getApplication(id: string): Promise<Application | null> {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*, job_listings(company, role, external_url)')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Application;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`updateApplicationStatus: ${error.message}`);

  await supabaseAdmin.from('application_events').insert({
    application_id: id,
    event_type: 'status_change',
    new_value: status,
    source: 'user',
  });
}

export async function updateApplicationDraft(
  id: string,
  fields: { cover_letter?: string; resume_bullets?: Record<string, string>[] },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('applications')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`updateApplicationDraft: ${error.message}`);
}

export async function listResumes(): Promise<Resume[]> {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listResumes: ${error.message}`);
  return (data ?? []) as Resume[];
}

export async function getActiveResume(): Promise<Resume | null> {
  const { data } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();
  return data as Resume | null;
}

export async function saveResume(
  label: string,
  raw_text: string,
  structured: object,
): Promise<Resume> {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .insert({ label, raw_text, structured, is_active: false })
    .select()
    .single();
  if (error) throw new Error(`saveResume: ${error.message}`);
  return data as Resume;
}

export async function listUserProfile(): Promise<UserProfileEntry[]> {
  const { data, error } = await supabaseAdmin
    .from('user_profile')
    .select('*')
    .order('category')
    .order('sort_order');
  if (error) throw new Error(`listUserProfile: ${error.message}`);
  return (data ?? []) as UserProfileEntry[];
}

export async function listShortlistedListings(): Promise<JobListing[]> {
  const { data, error } = await supabaseAdmin
    .from('job_listings')
    .select('*')
    .eq('status', 'shortlisted')
    .order('match_score', { ascending: false });
  if (error) throw new Error(`listShortlistedListings: ${error.message}`);
  return (data ?? []) as JobListing[];
}
