'use client';

import { useState, useTransition } from 'react';

interface PATTokenCardProps {
  token: string;
  masked: string;
  rotateAction: () => Promise<void>;
}

export function PATTokenCard({ token, masked, rotateAction }: PATTokenCardProps) {
  const [copied, setCopied]        = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCopy() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleRotate() {
    if (!confirm('Rotate token? The current token will stop working immediately.')) return;
    startTransition(() => rotateAction());
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-4 py-3">
        <code className="flex-1 font-mono text-sm text-zinc-700">{masked}</code>
        <button
          onClick={handleCopy}
          className="font-mono text-xs text-zinc-400 hover:text-zinc-900 transition-colors px-2"
        >
          {copied ? 'copied' : 'copy'}
        </button>
        <div className="w-px h-4 bg-zinc-200" />
        <button
          onClick={handleRotate}
          disabled={pending}
          className="font-mono text-xs text-zinc-400 hover:text-red-500 transition-colors px-2 disabled:opacity-40"
        >
          {pending ? 'rotating…' : 'rotate'}
        </button>
      </div>
      <p className="font-mono text-xs text-zinc-400">
        Copy and paste into the Claude.ai MCP connector when prompted. Rotate to invalidate the old token.
      </p>
    </div>
  );
}
