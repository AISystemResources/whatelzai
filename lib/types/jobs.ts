export type ApplicationStatus =
  | 'draft' | 'ready' | 'submitted' | 'acknowledged'
  | 'interviewing' | 'offered' | 'accepted' | 'rejected'
  | 'withdrawn' | 'ghosted';

export type JobListing = {
  readonly id: string;
  readonly source_id: string | null;
  readonly company_id: string | null;
  readonly external_id: string | null;
  readonly external_url: string | null;
  readonly company: string;
  readonly role: string;
  readonly location: string | null;
  readonly remote_type: 'onsite' | 'hybrid' | 'remote' | null;
  readonly salary_min: number | null;
  readonly salary_max: number | null;
  readonly salary_currency: string;
  readonly description: string | null;
  readonly match_score: number | null;
  readonly score_reasoning: string | null;
  readonly status: 'new' | 'shortlisted' | 'applying' | 'applied' | 'rejected_by_user' | 'expired';
  readonly discovered_at: string;
};

export type Application = {
  readonly id: string;
  readonly listing_id: string | null;
  readonly resume_id: string | null;
  readonly cover_letter: string | null;
  readonly resume_bullets: Record<string, string>[] | null;
  readonly status: ApplicationStatus;
  readonly applied_at: string | null;
  readonly applied_via: string | null;
  readonly response_status: string | null;
  readonly follow_up_at: string | null;
  readonly follow_up_count: number;
  readonly created_at: string;
  readonly updated_at: string;
  readonly job_listings?: Pick<JobListing, 'company' | 'role' | 'external_url'> | null;
};

export type ResumeStructured = {
  readonly summary: string;
  readonly skills: string[];
  readonly experience: Array<{
    readonly company: string;
    readonly role: string;
    readonly period: string;
    readonly bullets: string[];
    readonly technologies: string[];
  }>;
  readonly education: Array<{ readonly institution: string; readonly degree: string; readonly period: string }>;
  readonly achievements: string[];
};

export type Resume = {
  readonly id: string;
  readonly label: string;
  readonly raw_text: string;
  readonly structured: ResumeStructured;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
};

export type Company = {
  readonly id: string;
  readonly name: string;
  readonly industry: string | null;
  readonly website: string | null;
  readonly careers_url: string | null;
  readonly ats_type: string | null;
  readonly ats_slug: string | null;
  readonly priority: number;
  readonly status: 'active' | 'paused' | 'archived';
};

export type UserProfileEntry = {
  readonly id: string;
  readonly category: string;
  readonly key: string;
  readonly value: string;
  readonly source: string;
};
