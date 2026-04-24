-- RLS: only service role reads/writes. MCP server uses service-role key.
alter table public.docs_sections enable row level security;
