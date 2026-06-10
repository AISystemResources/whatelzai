'use client';

import { type ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { SiteFooter } from './SiteFooter';
import { DeviceTracker } from './DeviceTracker';
import { CustomCursor } from './CustomCursor';

interface Props {
  isAdmin: boolean;
  children: ReactNode;
}

export function ShellProvider({ isAdmin, children }: Props) {
  return (
    <>
      <CustomCursor />
      <AppHeader />
      {children}
      <SiteFooter />
      {!isAdmin && <DeviceTracker />}
    </>
  );
}
