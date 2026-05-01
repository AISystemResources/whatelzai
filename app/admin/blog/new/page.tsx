import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import { BlogEditor } from '../_components/BlogEditor';

export const metadata: Metadata = { title: 'New post — whatelz.ai admin' };

async function createPost(formData: FormData): Promise<{ error?: string }> {
  'use server';
  const title   = formData.get('title') as string;
  const slug    = formData.get('slug') as string;
  const summary = formData.get('summary') as string;
  const content = formData.get('content') as string;
  const tags    = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);
  const status  = formData.get('status') as string;

  const { error } = await supabaseAdmin.from('blog_posts').insert({
    title, slug, summary, content, tags, status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };
  redirect('/admin/blog');
}

export default function NewPostPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Blog</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">New post</h1>
      </div>
      <BlogEditor action={createPost} />
    </div>
  );
}
