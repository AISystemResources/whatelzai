import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import { BlogEditor } from '../_components/BlogEditor';

export const metadata: Metadata = { title: 'Edit post — whatelz.ai admin' };

async function updatePost(id: string, formData: FormData): Promise<{ error?: string }> {
  'use server';
  const title   = formData.get('title') as string;
  const slug    = formData.get('slug') as string;
  const summary = formData.get('summary') as string;
  const content = formData.get('content') as string;
  const tags    = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);
  const status  = formData.get('status') as string;

  const { data: existing } = await supabaseAdmin
    .from('blog_posts').select('published_at, status').eq('id', id).single();

  const published_at =
    status === 'published' && existing?.status !== 'published'
      ? new Date().toISOString()
      : (existing?.published_at ?? null);

  const { error } = await supabaseAdmin
    .from('blog_posts')
    .update({ title, slug, summary, content, tags, status, published_at })
    .eq('id', id);

  if (error) return { error: error.message };
  redirect('/admin/blog');
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: post } = await supabaseAdmin
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (!post) notFound();

  const action = updatePost.bind(null, id);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Blog</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Edit post</h1>
      </div>
      <BlogEditor
        initial={{
          id:      post.id as string,
          slug:    post.slug as string,
          title:   post.title as string,
          summary: post.summary as string,
          content: post.content as string,
          tags:    post.tags as string[],
          status:  post.status as string,
        }}
        action={action}
      />
    </div>
  );
}
