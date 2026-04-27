import { supabaseAdmin } from './supabase-server';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  status: 'draft' | 'published';
}

export async function getAllPosts(includeUnpublished = false): Promise<PostMeta[]> {
  let query = supabaseAdmin
    .from('blog_posts')
    .select('slug, title, summary, tags, status, published_at')
    .order('published_at', { ascending: false });

  if (!includeUnpublished) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) return []; // table may not exist yet — degrade gracefully

  return (data ?? []).map((row) => ({
    slug:    row.slug,
    title:   row.title,
    date:    row.published_at ? (row.published_at as string).slice(0, 10) : '',
    summary: row.summary ?? '',
    tags:    (row.tags as string[]) ?? [],
    status:  row.status as 'draft' | 'published',
  }));
}

export async function getPost(slug: string): Promise<{ meta: PostMeta; content: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null; // table may not exist yet — 404 gracefully

  return {
    meta: {
      slug:    data.slug as string,
      title:   data.title as string,
      date:    data.published_at ? (data.published_at as string).slice(0, 10) : '',
      summary: (data.summary as string) ?? '',
      tags:    (data.tags as string[]) ?? [],
      status:  data.status as 'draft' | 'published',
    },
    content: data.content as string,
  };
}

export async function createPost(input: {
  slug:     string;
  title:    string;
  content:  string;
  summary?: string;
  tags?:    string[];
  status?:  'draft' | 'published';
}) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .insert({
      slug:         input.slug,
      title:        input.title,
      content:      input.content,
      summary:      input.summary ?? '',
      tags:         input.tags ?? [],
      status:       input.status ?? 'draft',
      published_at: input.status === 'published' ? now : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost(
  slug: string,
  updates: Partial<{
    title:    string;
    summary:  string;
    content:  string;
    tags:     string[];
    status:   'draft' | 'published';
  }>,
) {
  const patch: Record<string, unknown> = { ...updates };
  if (updates.status === 'published') {
    patch.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .update(patch)
    .eq('slug', slug)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(slug: string) {
  const { error } = await supabaseAdmin
    .from('blog_posts')
    .delete()
    .eq('slug', slug);

  if (error) throw error;
  return { ok: true };
}
