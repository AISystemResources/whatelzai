import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/contact-form";
import { PageShell } from "@/components/shell/PageShell";
import { getSiteIdentity } from "@/lib/site-identity";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteIdentity();
  return { title: `Contact — ${s.owner_name}` };
}

export default async function ContactPage() {
  const s = await getSiteIdentity();
  return (
    <PageShell
      title="Contact"
      description="Open to AI Engineering roles, collabs, and consulting."
    >
      <p className="text-sm text-zinc-500 max-w-xl mb-2">
        The fastest way to reach me is through this form
        {s.linkedin_url && (
          <>
            {" "}
            — or DM me on{" "}
            <a
              href={s.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900 transition-colors"
            >
              LinkedIn
            </a>
          </>
        )}
        .
      </p>
      <ContactForm fallbackEmail={s.email} />
    </PageShell>
  );
}
