import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { jobDiscovery } from '@/inngest/functions/job-discovery';
import { morningBriefing } from '@/inngest/functions/morning-briefing';

export const { GET, POST, PUT } = serve({ client: inngest, functions: [jobDiscovery, morningBriefing] });
