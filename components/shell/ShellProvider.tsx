'use client';

import { type ReactNode } from 'react';
import { DrawerStoreProvider, useDrawerStore } from '@/lib/shell/drawer-store';
import { NavRegistryProvider } from '@/lib/shell/nav-registry';
import { useIsDesktop } from '@/lib/shell/use-is-desktop';
import { AppHeader } from './AppHeader';
import { LeftDrawer } from './LeftDrawer';
import { DeviceTracker } from './DeviceTracker';

function ShellCanvas({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  const { state } = useDrawerStore();
  const isDesktop = useIsDesktop();
  const ml = isDesktop && state.left ? 256 : 0;

  return (
    <>
      <AppHeader isAdmin={isAdmin} />
      <div
        className="fixed overflow-y-auto"
        style={{ top: 56, bottom: 0, left: ml, right: 0, transition: 'left 200ms' }}
      >
        {children}
      </div>
      {!isAdmin && <DeviceTracker />}
    </>
  );
}

interface Props {
  isAdmin: boolean;
  children: ReactNode;
}

export function ShellProvider({ isAdmin, children }: Props) {
  return (
    <NavRegistryProvider>
      <DrawerStoreProvider>
        <LeftDrawer isAdmin={isAdmin} />
        <ShellCanvas isAdmin={isAdmin}>{children}</ShellCanvas>
      </DrawerStoreProvider>
    </NavRegistryProvider>
  );
}
