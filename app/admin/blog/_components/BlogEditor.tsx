'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface BlogEditorProps {
  initial?: {
    id?: string;
    slug?: string;
    title?: string;
    summary?: string;
    content?: string;
    tags?: string[];
    status?: string;
  };
  action: (formData: FormData) => Promise<{ error?: string }>;
}

export function BlogEditor({ initial = {}, action }: BlogEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/admin/blog');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Title</span>
          <input
            name="title"
            defaultValue={initial.title ?? ''}
            required
            className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
          />
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Slug</span>
          <input
            name="slug"
            defaultValue={initial.slug ?? ''}
            required
            placeholder="my-post-title"
            className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Summary</span>
        <input
          name="summary"
          defaultValue={initial.summary ?? ''}
          className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Content (Markdown)</span>
        <textarea
          name="content"
          defaultValue={initial.content ?? ''}
          rows={20}
          className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 resize-y"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Tags (comma-separated)</span>
          <input
            name="tags"
            defaultValue={(initial.tags ?? []).join(', ')}
            placeholder="ai, engineering"
            className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
          />
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Status</span>
          <select
            name="status"
            defaultValue={initial.status ?? 'draft'}
            className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="border border-zinc-900 px-5 py-2 font-mono text-xs uppercase tracking-widest text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          className="font-mono text-xs text-zinc-400 hover:text-zinc-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
