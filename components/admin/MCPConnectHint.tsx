"use client";

import { useState } from "react";

const MCP_URL = "https://whatelz.ai/api/mcp/whatelz";
const CLAUDE_CODE_CMD = `claude mcp add whatelz --transport http ${MCP_URL}`;

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[9px] tracking-widest text-zinc-400 uppercase">
        {label}
      </p>
      <button
        type="button"
        onClick={onCopy}
        title={copied ? "Copied" : "Click to copy"}
        className="flex w-full items-center gap-2 border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left transition-colors hover:border-zinc-400"
      >
        <code className="flex-1 truncate font-mono text-[10px] text-zinc-700">
          {value}
        </code>
        <span
          className="shrink-0 font-mono text-[9px] tracking-widest text-zinc-400 uppercase"
          aria-hidden
        >
          {copied ? "✓" : "⧉"}
        </span>
      </button>
    </div>
  );
}

export function MCPConnectHint() {
  return (
    <div className="space-y-3">
      <CopyRow label="Connect to Claude Code" value={CLAUDE_CODE_CMD} />
      <CopyRow label="Connect to Claude.ai" value={MCP_URL} />
    </div>
  );
}
