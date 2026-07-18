import type { Metadata } from "next";
import { TestimonialForm } from "../Form";

export const metadata: Metadata = {
  title: "New testimonial — whatelz.ai Admin",
};

export default function NewTestimonialPage() {
  return <TestimonialForm initial={null} />;
}
