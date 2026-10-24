import { FocusSettingsCard } from "@/components/admin/FocusSettings";
import type { Metadata } from "next";
import { PushNotifications } from "@/components/admin/PushNotifications";
import { AdminArea } from "@/components/admin/AdminArea";
import Link from "@/components/admin/AdminLink";
import { adminUrl } from "@/lib/admin-url";
import { InstallAppButton } from "@/components/fcos/AppInstallation";
import { SignOutButton } from "@/components/auth/AuthControls";

export const metadata: Metadata = { title: "Settings — Admin" };

export default function SettingsPage() {
  return (
    <AdminArea
      title="Settings"
      intro={<PushNotifications />}
      description="Your preferences."
      links={[
        {
          href: "/admin/profile",
          label: "My profile",
          description: "Manage your profile and related website content.",
        },
      ]}
    >
      <FocusSettingsCard />
      <section
        aria-labelledby="admin-install"
        className="max-w-2xl rounded-2xl border border-zinc-200 p-6"
      >
        <h2 id="admin-install" className="font-semibold text-zinc-900">
          App
        </h2>
        <div className="mt-4">
          <InstallAppButton />
        </div>
      </section>
      <details className="max-w-2xl rounded-2xl border border-zinc-200 p-6">
        <summary className="min-h-11 cursor-pointer font-semibold">
          Advanced
        </summary>
        <div className="mt-4 flex flex-col items-start gap-4 text-sm">
          <Link
            href={adminUrl("/admin/tokens")}
            className="min-h-11 py-3 underline underline-offset-4"
          >
            MCP & API access →
          </Link>
        </div>
      </details>
      <section
        aria-labelledby="admin-account"
        className="max-w-2xl rounded-2xl border border-zinc-200 p-6"
      >
        <h2 id="admin-account" className="font-semibold">
          Your account
        </h2>

        <SignOutButton
          redirectUrl="/sign-in"
          className="mt-4 min-h-11 rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium disabled:opacity-50"
        />
      </section>
    </AdminArea>
  );
}
