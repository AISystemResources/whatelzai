import type { Metadata } from 'next';
import { listResumeVersions } from '@/lib/resume-versions';
import { ResumeEditor } from './_components/ResumeEditor';

export const metadata: Metadata = { title: 'Resume — whatelz.ai admin' };

export default async function AdminResumePage() {
  const versions = await listResumeVersions();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Resume</h1>
        </div>
      </div>

      <ResumeEditor initialVersions={versions} />
    </div>
  );
}
