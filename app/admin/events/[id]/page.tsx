import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceEvent } from "@/lib/service-events";
import { EventForm } from "../EventForm";

export const metadata: Metadata = { title: "Edit event — whatelz.ai Admin" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getServiceEvent(id);
  if (!event) notFound();
  return <EventForm initial={event} />;
}
