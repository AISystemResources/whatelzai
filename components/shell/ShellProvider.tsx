"use client";

import { type ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { SiteFooter } from "./SiteFooter";
import { DeviceTracker } from "./DeviceTracker";
import { usePathname } from "next/navigation";
import { ContinueExploring } from "@/components/editorial/FieldElements";

interface Props {
  isAdmin: boolean;
  ownerName: string;
  children: ReactNode;
}

export function ShellProvider({ isAdmin, ownerName, children }: Props) {
  const path = usePathname();
  const isPublic = !path.startsWith("/admin");
  return (
    <>
      <AppHeader />
      <div
        id="site-content"
        tabIndex={-1}
        className={isPublic ? "public-site" : undefined}
      >
        {children}
      </div>
      {isPublic && path !== "/" && !path.startsWith("/playbook") && (
        <ContinueExploring />
      )}
      <SiteFooter ownerName={ownerName} />
      {!isAdmin && <DeviceTracker />}
    </>
  );
}
