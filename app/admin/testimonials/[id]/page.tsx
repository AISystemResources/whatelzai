import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTestimonial } from "@/lib/testimonials";
import { listServiceEvents } from "@/lib/service-events";
import { TestimonialForm } from "../Form";

export const metadata: Metadata = {
  title: "Edit testimonial — whatelz.ai Admin",
};

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, events] = await Promise.all([getTestimonial(id), listServiceEvents()]);
  if (!t) notFound();
  return (
    <TestimonialForm
      initial={t}
      completionToken={t.completion_token}
      events={events}
    />
  );
}
