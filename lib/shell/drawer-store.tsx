'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';

type State = { left: boolean; right: boolean };

type Action =
  | { type: 'TOGGLE_LEFT' }
  | { type: 'TOGGLE_RIGHT' }
  | { type: 'OPEN_RIGHT' }
  | { type: 'CLOSE_LEFT' }
  | { type: 'CLOSE_RIGHT' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_LEFT':  return { ...state, left: !state.left };
    case 'TOGGLE_RIGHT': return { ...state, right: !state.right };
    case 'OPEN_RIGHT':   return { ...state, right: true };
    case 'CLOSE_LEFT':   return { ...state, left: false };
    case 'CLOSE_RIGHT':  return { ...state, right: false };
  }
}

type DrawerCtx = { state: State; dispatch: React.Dispatch<Action> };
const Ctx = createContext<DrawerCtx | null>(null);

export function DrawerStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { left: false, right: false });
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useDrawerStore(): DrawerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDrawerStore must be inside DrawerStoreProvider');
  return ctx;
}
