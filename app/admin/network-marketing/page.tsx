import type { Metadata } from "next";
import { AdminArea } from "@/components/admin/AdminArea";

export const metadata: Metadata = { title: "Network Marketing — Admin" };

export default function NetworkMarketingPage() {
  return (
    <AdminArea
      title="Network Marketing"
      description="Manage your team here and open the shared member workspace for community activities."
      links={[
        {
          href: "https://app.whatelz.ai/catalogue",
          label: "Product catalogue",
          description:
            "Browse Malaysia and Singapore price references and source-backed PV/BV explanations.",
        },
        {
          href: "/admin/team",
          label: "Team management",
          description:
            "Explore relationships and update member details, current levels and goals.",
        },
        {
          href: "https://app.whatelz.ai",
          label: "Member workspace",
          description:
            "Open the community app. Each member sees the team information their account is permitted to access.",
        },
      ]}
    />
  );
}
