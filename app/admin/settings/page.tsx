import type { Metadata } from "next";
import { PushNotifications } from "@/components/admin/PushNotifications";
import { AdminArea } from "@/components/admin/AdminArea";
import { MCPConnectHint } from "@/components/admin/MCPConnectHint";
import { InstallAppButton } from "@/components/fcos/AppInstallation";
import { SignOutButton } from "@/components/auth/AuthControls";

export const metadata: Metadata = { title: "Settings — Admin" };

export default function SettingsPage() {
  return (
    <AdminArea
      title="Settings"
      intro={<PushNotifications />}
      description="Your profile and connections to the tools you use."
      links={[
        {
          href: "/admin/design-system",
          label: "Brand & design system",
          description: "Your Whatelz logo, colours and downloadable assets.",
        },
        {
          href: "/admin/profile",
          label: "My profile",
          description: "Manage your profile and related website content.",
        },
        {
          href: "/admin/tokens",
          label: "MCP & API access",
          description: "Manage access tokens for connected tools and agents.",
        },
        {
          href: "/admin/developer",
          label: "Developer tools",
          description: "Open technical configuration and infrastructure links.",
        },
      ]}
    >
      <section
        aria-labelledby="admin-install"
        className="max-w-2xl rounded-2xl border border-zinc-200 p-6"
      >
        <h2 id="admin-install" className="font-semibold text-zinc-900">
          Your command centre, on your phone
        </h2>
        <p className="mt-2 mb-5 text-sm leading-6 text-zinc-600">
          Add Whatelz Admin to your home screen. It opens on Today, ready for
          your morning brief and evening closeout. Your owner sign-in is still
          required, and reading needs an internet connection.
        </p>
        <InstallAppButton />
      </section>
      <section
        aria-labelledby="mcp-connections"
        className="max-w-2xl rounded-xl border border-zinc-200 p-6"
      >
        <h2 id="mcp-connections" className="font-semibold text-zinc-900">
          MCP connections
        </h2>
        <p className="mb-5 mt-2 text-sm text-zinc-600">
          Connect your assistant to Whatelz. Access tokens remain managed
          separately from your website sign-in.
        </p>
        <MCPConnectHint />
      </section>
      <section
        aria-labelledby="admin-account"
        className="max-w-2xl rounded-2xl border border-zinc-200 p-6"
      >
        <h2 id="admin-account" className="font-semibold">
          Your account
        </h2>
        <p className="mt-2 mb-4 text-sm text-zinc-600">
          Sign out of this device when you’re finished.
        </p>
        <SignOutButton
          redirectUrl="/sign-in"
          className="min-h-11 rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium disabled:opacity-50"
        />
      </section>
    </AdminArea>
  );
}
