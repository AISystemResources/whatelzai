'use client';

import { useEffect, useRef } from 'react';
import { useDrawerStore } from '@/lib/shell/drawer-store';
import { useChatContext } from './ShellProvider';

export function RightDrawer() {
  const { state, dispatch } = useDrawerStore();
  const { messages, status, isNavigating } = useChatContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {state.right && (
        <div
          className="fixed inset-0 z-[45] bg-black/40 md:hidden"
          onClick={() => dispatch({ type: 'CLOSE_RIGHT' })}
          aria-hidden
        />
      )}
    <aside
      className={`fixed top-0 right-0 z-50 flex h-screen w-[360px] flex-col border-l border-zinc-200 bg-[var(--background)] transition-transform duration-200 ${
        state.right ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-label="Chat"
    >
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3" aria-live="polite">
        {messages.length === 0 && status !== 'submitted' && status !== 'streaming' ? (
          <p className="text-sm text-zinc-400 mt-8 text-center">Ask me anything about Edmund.</p>
        ) : (
          messages.map(m => {
            const text = (m.parts as Array<{ type: string; text?: string }>)
              .filter(p => p.type === 'text')
              .map(p => p.text ?? '')
              .join('');
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[var(--accent)] text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {text || <span className="opacity-40">…</span>}
                </div>
              </div>
            );
          })
        )}
        {status === 'submitted' && (
          <div className="flex justify-end">
            <div className="rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-400">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
              </span>
            </div>
          </div>
        )}
        {isNavigating && (
          <div className="px-4 py-2 text-xs text-zinc-400 font-mono flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
            Navigating…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </aside>
    </>
  );
}
