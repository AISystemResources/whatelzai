import type { Metadata } from "next";
import { AdminArea } from "@/components/admin/AdminArea";
import { MCPConnectHint } from "@/components/admin/MCPConnectHint";

export const metadata: Metadata = { title: "Settings — Admin" };

export default function SettingsPage() {
  return (
    <AdminArea
      title="Settings"
      description="Your profile and connections to the tools you use."
      links={[
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
    </AdminArea>
  );
}
