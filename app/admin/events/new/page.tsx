import type { Metadata } from "next";
import { EventForm } from "../EventForm";

export const metadata: Metadata = { title: "New event — whatelz.ai Admin" };

export default function NewEventPage() {
  return <EventForm initial={null} />;
}
