'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useRouter, usePathname } from 'next/navigation';
import { DrawerStoreProvider, useDrawerStore } from '@/lib/shell/drawer-store';
import { NavRegistryProvider } from '@/lib/shell/nav-registry';
import { useIsDesktop } from '@/lib/shell/use-is-desktop';
import { navigationMap } from '@/lib/navigation-map';
import { supabase } from '@/lib/supabase-client';
import { AppHeader } from './AppHeader';
import { LeftDrawer } from './LeftDrawer';
import { RightDrawer } from './RightDrawer';
import { BottomInput } from './BottomInput';
import { DeviceTracker } from './DeviceTracker';

// ── Chat context ──────────────────────────────────────────────────────────────

type ChatCtx = {
  messages: UIMessage[];
  status: string;
  stop: () => void;
  sendMessage: (opts: { text: string }) => void;
  input: string;
  setInput: (v: string) => void;
};

const ChatCtxRef = createContext<ChatCtx | null>(null);

export function useChatContext(): ChatCtx {
  const ctx = useContext(ChatCtxRef);
  if (!ctx) throw new Error('useChatContext must be inside ShellProvider');
  return ctx;
}

// ── Pulse highlight ───────────────────────────────────────────────────────────

function pulseElement(el: HTMLElement) {
  const accent = 'rgba(250,204,21,0.7)';
  el.style.transition = 'box-shadow 300ms ease';
  el.style.boxShadow = `0 0 0 3px ${accent}`;
  setTimeout(() => { el.style.boxShadow = '0 0 0 0px transparent'; }, 300);
  setTimeout(() => { el.style.boxShadow = `0 0 0 3px ${accent}`; }, 600);
  setTimeout(() => {
    el.style.boxShadow = '0 0 0 0px transparent';
    setTimeout(() => { el.style.transition = ''; el.style.boxShadow = ''; }, 310);
  }, 900);
}

// ── Specific hackathon name patterns → search query ───────────────────────────

const HACKATHON_PATTERNS: Array<{ re: RegExp; q: string }> = [
  { re: /hackomania/i,         q: 'hackomania'    },
  { re: /pan.?sea/i,           q: 'pan-sea'       },
  { re: /singhacks|sing hacks/i, q: 'singhacks'  },
  { re: /youth.?finance/i,     q: 'youth finance' },
  { re: /asmi/i,               q: 'asmi'          },
];

async function lookupHackathonRoute(text: string): Promise<string | null> {
  for (const { re, q } of HACKATHON_PATTERNS) {
    if (!re.test(text)) continue;
    const { data } = await supabase
      .from('hackathons')
      .select('id')
      .ilike('name', `%${q}%`)
      .eq('published', true)
      .limit(1)
      .single();
    if (data?.id) return `/hackathons/${data.id}`;
  }
  return null;
}

// ── General topic detection ───────────────────────────────────────────────────

function detectTopic(text: string): string | null {
  const t = text.toLowerCase();
  if (/hackathon|hackomania|pan.?sea|singhack|coding.{0,20}win|win.{0,20}hack/.test(t)) return 'hackathons';
  if (/internship|career|prudential|setel|asiaverify|work.{0,15}experience|experience.{0,15}work/.test(t)) return 'career';
  if (/\batlas\b|doublelead|double.?lead|\bproject/.test(t)) return 'projects';
  if (/contact|email.{0,15}edmund|reach.{0,15}edmund|get.{0,15}touch/.test(t)) return 'contact';
  if (/youtube|instagram|\bmedium\b|linkedin|channel/.test(t)) return 'channels';
  return null;
}

// ── NavHandler — fires after stream finishes ──────────────────────────────────

function NavHandler() {
  const { messages, status } = useChatContext();
  const { dispatch } = useDrawerStore();
  const router = useRouter();
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (status !== 'ready') return;

    const assistantMsgs = messages.filter(m => m.role === 'assistant');
    if (assistantMsgs.length === 0) return;
    const latest = assistantMsgs[assistantMsgs.length - 1];
    if (firedRef.current.has(latest.id)) return;
    firedRef.current.add(latest.id);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const doNavigate = (route: string) => {
      const go = () => router.push(route);
      if (isMobile) {
        dispatch({ type: 'CLOSE_RIGHT' });
        setTimeout(go, 220);
      } else {
        go();
      }
    };

    (async () => {
      // Helper: scroll to section on homepage then push to page after delay
      const scrollThenPush = (scrollId: string, route: string) => {
        if (isMobile) { dispatch({ type: 'CLOSE_RIGHT' }); }
        const el = document.getElementById(scrollId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => pulseElement(el), 400);
        }
        setTimeout(() => router.push(route), 1200);
      };

      // 1. Explicit navigate_to tool result (may include id for hackathon deep link)
      for (const part of latest.parts) {
        if (part.type !== 'dynamic-tool') continue;
        const p = part as { toolName: string; state: string; output?: unknown };
        if (p.toolName !== 'navigate_to' || p.state !== 'output-available') continue;
        const result = p.output as { action: string; target: string; id?: string } | undefined;
        if (result?.action !== 'navigate') continue;
        if (result.id) { doNavigate(`/hackathons?highlight=${result.id}`); return; }
        const dest = navigationMap[result.target];
        if (dest) { scrollThenPush(dest.scrollId, dest.route); return; }
      }

      const text = latest.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text).join(' ');

      // 2. Specific hackathon → list page with highlight param
      const specificRoute = await lookupHackathonRoute(text);
      if (specificRoute) {
        // lookupHackathonRoute returns /hackathons/[id], convert to highlight param
        const id = specificRoute.split('/').pop();
        doNavigate(`/hackathons?highlight=${id}`);
        return;
      }

      // 3. General topic → scroll to section on homepage, then push to page
      const topic = detectTopic(text);
      if (topic) {
        const dest = navigationMap[topic];
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          scrollThenPush(dest.scrollId, dest.route);
        } else {
          doNavigate(dest.route);
        }
      }
    })();
  }, [status, messages, dispatch, router]);

  return null;
}

// ── ShellCanvas — reads drawer state and shifts the content area ──────────────

function ShellCanvas({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  const { state } = useDrawerStore();
  const isDesktop = useIsDesktop();
  const ml = isDesktop && state.left ? 256 : 0;
  const mr = isDesktop && state.right ? 360 : 0;

  return (
    <>
      <AppHeader isAdmin={isAdmin} />

      {/* Content viewport: fills space below header, shifts with drawers */}
      <div
        className="fixed overflow-y-auto pb-24"
        style={{ top: 56, bottom: 0, left: ml, right: mr, transition: 'left 200ms, right 200ms' }}
      >
        {children}
      </div>

      <BottomInput />
      {!isAdmin && <DeviceTracker />}
      <NavHandler />
    </>
  );
}

// ── ShellProvider ─────────────────────────────────────────────────────────────

interface Props {
  isAdmin: boolean;
  children: ReactNode;
}

export function ShellProvider({ isAdmin, children }: Props) {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, stop } = useChat({ transport });
  const [input, setInput] = useState('');

  return (
    <ChatCtxRef.Provider value={{ messages, sendMessage, status, stop, input, setInput }}>
      <NavRegistryProvider>
        <DrawerStoreProvider>
          <LeftDrawer isAdmin={isAdmin} />
          <RightDrawer />
          <ShellCanvas isAdmin={isAdmin}>{children}</ShellCanvas>
        </DrawerStoreProvider>
      </NavRegistryProvider>
    </ChatCtxRef.Provider>
  );
}
