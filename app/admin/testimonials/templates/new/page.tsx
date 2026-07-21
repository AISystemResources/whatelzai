import type { Metadata } from "next";
import { TemplateForm } from "../TemplateForm";

export const metadata: Metadata = {
  title: "New template — whatelz.ai Admin",
};

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Templates
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          New group prefill template
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Save to generate the QR code + shareable link.
        </p>
      </div>
      <TemplateForm isNew />
    </div>
  );
}
