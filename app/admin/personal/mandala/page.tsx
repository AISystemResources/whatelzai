import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "@/components/admin/AdminLink";
import { BriefDocument } from "@/components/admin/BriefDocument";
import { BriefMarkdown } from "@/components/admin/BriefMarkdown";
import { adminUrl } from "@/lib/admin-url";
import { loadMandala } from "@/lib/mandala-server";
import { MANDALA_PATH, mandalaAreas } from "@/lib/mandala";
import { readingSections } from "@/lib/admin-reading";

export const metadata: Metadata = { title: "My Mandala — Personal — Admin" };

export default function MandalaPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3 border-b border-zinc-200 pb-6">
        <Link href={adminUrl("/admin/personal")} className="text-sm underline">
          ← Personal
        </Link>
        <h1>My Mandala</h1>
        <p className="text-sm text-zinc-500">
          The whole picture. An editable first pass, not 64 tasks due today.
        </p>
      </header>
      <Suspense
        fallback={
          <p role="status" className="text-sm text-zinc-500">
            Reading your saved plan…
          </p>
        }
      >
        <SavedMandala />
      </Suspense>
    </div>
  );
}

async function SavedMandala() {
  const result = await loadMandala();
  if (result.state === "unavailable")
    return (
      <p role="alert">
        Your plan could not be read from EMDEE. Check your existing EMDEE
        connection and try again. No saved plan has been changed.
      </p>
    );
  if (result.state === "missing")
    return <p>No Mandala document is available at the saved destination.</p>;
  if (result.state === "empty")
    return <p>The document has no Notes section to display.</p>;
  const { doc, body } = result;
  const areas = mandalaAreas(body);
  const centre = readingSections(body).find((section) =>
    section.title.startsWith("Centre —"),
  );
  const blocks = areas ? [...areas.slice(0, 4), null, ...areas.slice(4)] : null;
  return (
    <div className="space-y-8">
      <p className="text-xs text-zinc-500">
        Read from EMDEE · Refresh this page for the latest saved version.
      </p>
      {centre && (
        <section className="max-w-[72ch] border-l-2 border-yellow-400 pl-5">
          <h2 className="mb-3 text-xl font-semibold">
            {centre.title.replace(/^Centre — /, "")}
          </h2>
          <BriefMarkdown body={centre.body.split(/\n\s*\n/)[0]} />
        </section>
      )}
      {blocks && (
        <details className="border-b border-zinc-200 pb-5">
          <summary className="cursor-pointer py-3 font-medium">
            Explore the complete 9×9 grid
          </summary>
          <div
            role="region"
            aria-label="Complete 9 by 9 Mandala; scroll horizontally"
            tabIndex={0}
            className="mt-4 max-w-full overflow-x-auto pb-4"
          >
            <div className="grid min-w-[1100px] grid-cols-3 gap-3">
              {blocks.map((area, blockIndex) => (
                <div
                  key={blockIndex}
                  className="grid grid-cols-3 gap-px border border-zinc-200 bg-zinc-200"
                >
                  {Array.from({ length: 9 }, (_, cellIndex) => {
                    const i = cellIndex < 4 ? cellIndex : cellIndex - 1;
                    const text =
                      cellIndex === 4
                        ? (area?.title ?? "3 years to financial freedom")
                        : area
                          ? area.cells[i].title
                          : areas![i].title;
                    return (
                      <div
                        key={cellIndex}
                        className={`flex min-h-24 items-center justify-center p-3 text-center text-xs leading-5 ${cellIndex === 4 ? "bg-yellow-300 font-semibold text-zinc-950" : "bg-white text-zinc-700"}`}
                      >
                        {text}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </details>
      )}
      <BriefDocument body={body} />
      <details className="border-t border-zinc-200 py-3 text-xs text-zinc-500">
        <summary className="cursor-pointer py-3">
          Source and original document
        </summary>
        <p className="my-3 break-all">
          {MANDALA_PATH} · {doc.doc_content_hash}
        </p>
        <BriefMarkdown body={doc.content!} />
      </details>
    </div>
  );
}
