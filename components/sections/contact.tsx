import { ContactForm } from "@/components/sections/contact-form";
import { getSiteIdentity } from "@/lib/site-identity";

export async function Contact() {
  const s = await getSiteIdentity();
  return (
    <section
      id="contact"
      data-section="Contact"
      data-section-href="/contact"
      className="px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
          Contact
        </p>
        <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Hiring, collaborating, or just curious?
        </h2>
        <p className="mt-6 max-w-xl text-base text-zinc-700">
          Drop a message below. LinkedIn DMs work too.
        </p>

        <ContactForm fallbackEmail={s.email} />

        <div className="mt-8 flex flex-wrap items-center gap-6 font-mono text-xs text-zinc-500">
          {s.linkedin_url && (
            <p>
              Prefer LinkedIn?{" "}
              <a
                href={s.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-zinc-900"
              >
                Send a DM ↗
              </a>
            </p>
          )}
          {s.resume_url && (
            <a
              href={s.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline underline-offset-2 hover:text-zinc-900"
            >
              View resume ↗
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
