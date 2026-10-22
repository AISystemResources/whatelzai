"use client";

import { type ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { SiteFooter } from "./SiteFooter";
import { DeviceTracker } from "./DeviceTracker";
import { AppInstallationProvider } from "@/components/fcos/AppInstallation";
import { usePathname } from "next/navigation";

interface Props {
  isAdmin: boolean;
  ownerName: string;
  surface?: "public" | "admin" | "app";
  children: ReactNode;
}

export function ShellProvider({
  isAdmin,
  ownerName,
  children,
  surface = "public",
}: Props) {
  const path = usePathname();
  const isPublic = surface === "public" && !path.startsWith("/admin");
  return (
    <>
      {isPublic && <AppHeader />}
      <div
        id="site-content"
        tabIndex={-1}
        className={isPublic ? "public-site" : "admin-theme"}
      >
        {surface === "app" ? (
          <AppInstallationProvider>{children}</AppInstallationProvider>
        ) : surface === "admin" ? (
          <AppInstallationProvider name="Admin" worker="/admin-sw.js">
            {children}
          </AppInstallationProvider>
        ) : (
          children
        )}
      </div>
      {isPublic && <SiteFooter ownerName={ownerName} />}
      {isPublic && !isAdmin && <DeviceTracker />}
    </>
  );
}
