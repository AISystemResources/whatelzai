"use client";

import { type ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { SiteFooter } from "./SiteFooter";
import { DeviceTracker } from "./DeviceTracker";
import { CustomCursor } from "./CustomCursor";

interface Props {
  isAdmin: boolean;
  ownerName: string;
  children: ReactNode;
}

export function ShellProvider({ isAdmin, ownerName, children }: Props) {
  return (
    <>
      <CustomCursor />
      <AppHeader />
      {children}
      <SiteFooter ownerName={ownerName} />
      {!isAdmin && <DeviceTracker />}
    </>
  );
}
