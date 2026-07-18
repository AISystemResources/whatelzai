-- Private "what can be improved" field for Edmund's reflection.
-- Never displayed publicly; visible only in admin.
alter table testimonials add column if not exists improvement_note text;
