drop trigger if exists trg_elzos_docs_sections_updated_at on elzos.docs_sections;

create trigger trg_elzos_docs_sections_updated_at
    before update on elzos.docs_sections
    for each row
    execute function elzos.touch_docs_sections_updated_at();
