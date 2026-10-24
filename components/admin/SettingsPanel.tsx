"use client";
import { FocusSettingsCard } from "@/components/admin/FocusSettings";
import { PushNotifications } from "@/components/admin/PushNotifications";
import {
  PreferenceRows,
  useAdminPreferences,
} from "@/components/admin/AdminPreferences";
import Link from "@/components/admin/AdminLink";
import { adminUrl } from "@/lib/admin-url";
import { InstallAppButton } from "@/components/fcos/AppInstallation";
import { SignOutButton } from "@/components/auth/AuthControls";
export default function SettingsPanel() {
  const { t, preferences } = useAdminPreferences();
  return (
    <div className="max-w-3xl text-zinc-900">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        {t("Settings")}
      </h1>
      <div className="divide-y divide-zinc-200 border-y border-zinc-200">
        <PreferenceRows />
        <PushNotifications />
        <FocusSettingsCard />
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <span className="text-sm font-medium">{t("App")}</span>
          <InstallAppButton language={preferences.language} />
        </div>
        <details className="py-4">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
            {t("Advanced")}
          </summary>
          <Link
            href={adminUrl("/admin/tokens")}
            className="inline-block min-h-11 py-3 text-sm underline underline-offset-4"
          >
            {t("MCP & API access →")}
          </Link>
        </details>
        <div className="flex items-center justify-between gap-4 py-5">
          <span className="text-sm font-medium">{t("Your account")}</span>
          <SignOutButton
            redirectUrl="/sign-in"
            className="min-h-11 px-3 text-sm underline underline-offset-4"
            labels={{
              idle: t("Sign out"),
              busy: t("Signing out…"),
              error: t("Could not sign out. Try again."),
            }}
          />
        </div>
      </div>
    </div>
  );
}
