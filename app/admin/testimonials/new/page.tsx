import type { Metadata } from "next";
import { NewPrefillForm } from "./NewPrefillForm";

export const metadata: Metadata = {
  title: "New prefill — whatelz.ai Admin",
};

export default function NewPrefillPage() {
  return <NewPrefillForm />;
}
