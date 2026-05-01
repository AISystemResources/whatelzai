-- updated_at trigger
create or replace function public.touch_docs_sections_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_docs_sections_updated_at on public.docs_sections;

create trigger trg_docs_sections_updated_at
    before update on public.docs_sections
    for each row
    execute function public.touch_docs_sections_updated_at();
