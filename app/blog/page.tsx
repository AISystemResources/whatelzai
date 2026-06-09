import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Edmund Lin Zhenming",
  description:
    "Irregular writing on AI systems, building in public, and whatever else is worth writing down.",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <main>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              Writing
            </p>
            {posts.length > 0 && (
              <span className="border border-zinc-200 px-2 py-0.5 font-mono text-[10px] tracking-widest text-zinc-400">
                {posts.length}
              </span>
            )}
          </div>
          <h1 className="mt-5 font-display text-5xl font-bold tracking-tight sm:text-6xl">
            Notes on building.
          </h1>
          <p className="mt-5 max-w-lg text-base text-zinc-600">
            Irregular writing on AI systems, building in public, and the odd
            thing I found interesting enough to write down.
          </p>
        </div>
      </section>

      {/* ── Posts list ──────────────────────────────────────────────── */}
      <section className="px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">

          {posts.length === 0 ? (
            <div className="flex flex-col items-start py-20">
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-zinc-100 w-8" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
                  Nothing here yet
                </p>
              </div>
              <p className="mt-6 text-zinc-500">
                First post coming soon.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {posts.map((post) => (
                <li key={post.slug} className="group py-10">
                  <article>
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                            {post.date}
                          </p>
                          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-amber-500 sm:text-3xl">
                            {post.title}
                          </h2>
                          {post.summary && (
                            <p className="mt-2 text-zinc-600">{post.summary}</p>
                          )}
                        </div>
                        <span
                          className="mt-3 shrink-0 text-zinc-300 transition-colors group-hover:text-amber-400"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </div>
                    </Link>
                    {post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-[10px] tracking-widest text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          )}

        </div>
      </section>

    </main>
  );
}
