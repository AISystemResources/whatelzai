import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPost, getAllPosts } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPost(slug);
  if (!result) return {};
  return {
    title: `${result.meta.title} — Edmund Lin Zhenming`,
    description: result.meta.summary || undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPost(slug);

  if (!result) notFound();

  const { meta, content } = result;

  return (
    <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/blog"
          className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          ← Blog
        </Link>

        <header className="mt-8 mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            {meta.date}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {meta.title}
          </h1>
          {meta.summary && (
            <p className="mt-3 text-zinc-500">{meta.summary}</p>
          )}
          {meta.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs tracking-widest text-zinc-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="space-y-5 text-zinc-700
          [&_a]:text-[var(--accent-text)] [&_a]:underline [&_a:hover]:no-underline
          [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500
          [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm
          [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-900
          [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-zinc-900
          [&_hr]:border-zinc-200
          [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal
          [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm
          [&_pre_code]:bg-transparent [&_pre_code]:p-0
          [&_strong]:font-semibold [&_strong]:text-zinc-900
          [&_ul]:space-y-1">
          <MDXRemote source={content} />
        </div>
      </div>
    </section>
  );
}
