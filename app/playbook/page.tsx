import type { Metadata } from "next";
import chapters from "@/content/playbook/chapters.json";
import { PlaybookReader } from "./_components/playbook-reader";

export const metadata: Metadata = {
  title: "The Solopreneur’s AI Playbook",
  description:
    "Money Mindset. AI Skillset. Read Edmund’s evolving playbook for building a business of your own.",
  alternates: { canonical: "https://whatelz.ai/playbook" },
  robots: { index: false, follow: true },
};

export default function PlaybookPage() {
  // Public draft preview, explicitly requested before paid access launches.
  // Future entitlement checks belong here, BEFORE sending chapter bodies to the client.
  return <PlaybookReader chapters={chapters} />;
}
