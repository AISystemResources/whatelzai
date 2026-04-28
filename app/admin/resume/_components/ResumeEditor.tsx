'use client';

import { useState, useTransition } from 'react';

interface Props {
  initialContent: string;
  updatedAt: string | null;
  onSave: (content: string) => Promise<void>;
}

export function ResumeEditor({ initialContent, updatedAt, onSave }: Props) {
  const [content, setContent]   = useState(initialContent);
  const [saved,   setSaved]     = useState(false);
  const [pending, startTransition] = useTransition();

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const dirty = content !== initialContent;

  function handleSave() {
    startTransition(async () => {
      await onSave(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-zinc-400">{wordCount} words</span>
          {updatedAt && (
            <span className="font-mono text-xs text-zinc-400">
              Last saved {new Date(updatedAt).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
          {dirty && !pending && (
            <span className="font-mono text-xs text-amber-500">Unsaved changes</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={pending || !dirty}
          className="border border-zinc-900 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Paste or write your resume in markdown…"
        spellCheck={false}
        className="w-full h-[calc(100vh-280px)] min-h-[400px] resize-none border border-zinc-200 rounded p-4 font-mono text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors leading-relaxed"
      />

      {/* MCP note */}
      <p className="font-mono text-xs text-zinc-400">
        Synced with FUNCTION_WHATELZ — Claude can read and update this via <code className="bg-zinc-100 px-1 rounded">get_resume</code> / <code className="bg-zinc-100 px-1 rounded">update_resume</code>.
      </p>
    </div>
  );
}
