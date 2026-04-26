import { inngest } from '../client';
import { supabaseAdmin } from '@/lib/supabase-server';

export const morningBriefing = inngest.createFunction(
  { id: 'morning-briefing', name: 'Morning Briefing', triggers: [{ cron: 'TZ=Asia/Singapore 0 8 * * *' }] },
  async ({ step }) => {
    const summary = await step.run('build-summary', async () => {
      const [{ data: newJobs }, { data: pendingApps }] = await Promise.all([
        supabaseAdmin
          .from('job_listings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'shortlisted'),
        supabaseAdmin
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ready'),
      ]);
      return {
        shortlistedJobs:  (newJobs as unknown as { count: number } | null)?.count ?? 0,
        readyApplications: (pendingApps as unknown as { count: number } | null)?.count ?? 0,
      };
    });

    await supabaseAdmin.from('agent_runs').insert({
      agent:       'morning-briefing',
      status:      'completed',
      finished_at: new Date().toISOString(),
      metadata:    summary,
    });

    return summary;
  },
);
