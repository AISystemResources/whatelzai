'use client';

import { type ReactNode } from 'react';
import { AppHeader } from './AppHeader';
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
      {!isAdmin && <DeviceTracker />}
    </>
  );
}
