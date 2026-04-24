create or replace function public.move_section_atomic(
    p_slug text,
    p_section_id uuid,
    p_old_position integer,
    p_new_position integer
) returns void language sql as $$
    update public.docs_sections
       set position = case
           when id = p_section_id then p_new_position
           when p_new_position > p_old_position
                and position > p_old_position
                and position <= p_new_position then position - 1
           when p_new_position < p_old_position
                and position >= p_new_position
                and position < p_old_position then position + 1
           else position
       end
     where doc_slug = p_slug
       and is_current = true;
$$;
