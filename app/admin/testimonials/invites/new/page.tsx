import type { Metadata } from "next";
import { NewInviteForm } from "./NewInviteForm";

export const metadata: Metadata = {
  title: "New invite — Testimonials Admin",
};

export default function NewInvitePage() {
  return <NewInviteForm />;
}
