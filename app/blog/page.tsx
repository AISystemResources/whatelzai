import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { ArticleSelection } from "@/components/editorial/ArticleSelection";
import { FieldHero } from "@/components/editorial/FieldElements";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Field notes",
  description:
    "Notes on money mindset, AI skillset and building a business of your own.",
  alternates: { canonical: "https://whatelz.ai/blog" },
};
export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  return (
    <main>
      <FieldHero
        label="The notebook"
        title="Learning, with the pages left open."
        description="Ideas I’m exploring. Lessons I’m testing. Notes on money, AI and the everyday practice of building something of your own."
      />
      <section className="field-wrap field-section">
        <div className="archive-label">
          <span>{posts.length} published notes</span>
        </div>
        {posts.length ? (
          <ArticleSelection posts={posts} />
        ) : (
          <div className="notebook-empty">
            <h2>The next page is being written.</h2>
            <p>
              In the meantime, there are twelve chapters waiting in the
              playbook.
            </p>
            <Link href="/playbook" className="field-button">
              Open the playbook ↗
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
