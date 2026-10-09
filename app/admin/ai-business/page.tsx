import type { Metadata } from "next";
import { AdminArea } from "@/components/admin/AdminArea";

export const metadata: Metadata = { title: "AI Business — Admin" };

const links = [
  {
    href: "/admin",
    label: "Website dashboard",
    description: "Manage website sections and review content activity.",
  },
  {
    href: "/admin/services",
    label: "Services",
    description: "Manage your AI offerings.",
  },
  {
    href: "/admin/blog",
    label: "Blog",
    description: "Write and publish articles.",
  },
  {
    href: "/admin/newsletter",
    label: "Newsletter",
    description: "Manage subscribers and newsletters.",
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    description: "Manage client feedback.",
  },
  {
    href: "/admin/landing",
    label: "Homepage",
    description: "Edit the public website.",
  },
  {
    href: "/admin/projects",
    label: "Projects",
    description: "Manage portfolio projects.",
  },
  {
    href: "/admin/career",
    label: "Career",
    description: "Manage your public career history.",
  },
  {
    href: "/admin/hackathons",
    label: "Hackathons",
    description: "Manage hackathon entries.",
  },
  {
    href: "/admin/leadership",
    label: "Leadership",
    description: "Manage leadership experience.",
  },
  {
    href: "/admin/mentorship",
    label: "Mentorship",
    description: "Manage mentorship content.",
  },
  {
    href: "/admin/events",
    label: "Events",
    description: "Manage public event content.",
  },
];

export default function AIBusinessPage() {
  return (
    <AdminArea
      title="AI Business"
      description="Your Whatelz website, offerings and marketing content. Product metrics are available in Overview."
      links={links}
    />
  );
}
