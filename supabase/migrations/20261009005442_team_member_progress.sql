-- Optional reported business progress, visible only within existing team access.
alter table public.business_team_people
  add column current_level text check (current_level is null or length(current_level) <= 120),
  add column next_goal text check (next_goal is null or length(next_goal) <= 240),
  add column progress_notes text check (progress_notes is null or length(progress_notes) <= 1000);
