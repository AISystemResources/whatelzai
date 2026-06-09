'use client';

import { type ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { SiteFooter } from './SiteFooter';
import { DeviceTracker } from './DeviceTracker';

interface Props {
  isAdmin: boolean;
  children: ReactNode;
}

export function ShellProvider({ isAdmin, children }: Props) {
  return (
    <>
      <AppHeader />
      {children}
      <SiteFooter />
      {!isAdmin && <DeviceTracker />}
    </>
  );
}
