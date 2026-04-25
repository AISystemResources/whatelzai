create or replace function elzos.shift_positions_up(p_slug text, p_from integer)
returns void language sql as $$
    update elzos.docs_sections
       set position = position + 1
     where doc_slug = p_slug
       and is_current = true
       and position >= p_from;
$$;
