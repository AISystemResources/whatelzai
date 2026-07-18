import type { Metadata } from "next";
import { listServiceEvents } from "@/lib/service-events";
import { NewPrefillForm } from "./NewPrefillForm";

export const metadata: Metadata = {
  title: "New prefill — whatelz.ai Admin",
};

export const dynamic = "force-dynamic";

export default async function NewPrefillPage() {
  const events = await listServiceEvents();
  return <NewPrefillForm events={events} />;
}
