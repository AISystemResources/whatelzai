import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-server';
import { listResumeVersions } from '@/lib/resume-versions';
import { ResumeEditor } from './_components/ResumeEditor';

export const metadata: Metadata = { title: 'Resume — whatelz.ai admin' };

async function getCanonicalResume() {
  const { data } = await supabaseAdmin
    .from('system_config')
    .select('value, updated_at')
    .eq('key', 'resume')
    .maybeSingle();
  return { content: (data?.value as string) ?? '', updatedAt: data?.updated_at ?? null };
}

async function saveResume(content: string) {
  'use server';
  const { error } = await supabaseAdmin
    .from('system_config')
    .upsert({ key: 'resume', value: content });
  if (error) throw error;
}

export default async function AdminResumePage() {
  const [{ content, updatedAt }, versions] = await Promise.all([
    getCanonicalResume(),
    listResumeVersions(),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Resume</h1>
        </div>
      </div>

      <ResumeEditor
        initialVersions={versions}
        canonicalContent={content}
        canonicalUpdatedAt={updatedAt}
        onSaveCanonical={saveResume}
      />
    </div>
  );
}
