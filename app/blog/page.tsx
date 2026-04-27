import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Edmund Lin Zhenming",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Blog</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-zinc-900">
          Writing
        </h1>

        {posts.length === 0 ? (
          <p className="mt-12 text-zinc-700">No posts yet. Check back soon.</p>
        ) : (
          <ul className="mt-12 divide-y divide-zinc-200">
            {posts.map((post) => (
              <li key={post.slug} className="py-8">
                <article>
                  <p className="font-mono text-xs tracking-widest text-zinc-400 uppercase">
                    {post.date}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition-colors hover:text-[var(--accent-text)]"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.summary && (
                    <p className="mt-2 text-zinc-700">{post.summary}</p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-xs tracking-widest text-zinc-400"
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
  );
}
