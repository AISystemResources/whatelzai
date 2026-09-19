import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PostMeta } from "@/lib/blog";

function dateLabel(date: string) {
  return date
    ? new Date(date).toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Article";
}
export function ArticleSelection({ posts }: { posts: PostMeta[] }) {
  const [featured, ...rest] = posts;
  if (!featured)
    return (
      <div className="notebook-empty">
        <h3>New writing is on the way.</h3>
        <p>Explore the playbook while the next article takes shape.</p>
        <Link href="/playbook" className="text-link">
          Open the playbook <ArrowUpRight size={18} />
        </Link>
      </div>
    );
  return (
    <div className="article-selection">
      <article className="featured-article">
        <span className="article-meta">{dateLabel(featured.date)}</span>
        <Link href={`/blog/${featured.slug}`}>
          <h2>{featured.title}</h2>
          <p>{featured.summary}</p>
          <span className="article-read">
            Read article <ArrowUpRight size={22} strokeWidth={1.5} />
          </span>
        </Link>
      </article>
      {rest.length > 0 && (
        <div className="supporting-articles">
          {rest.map((post) => (
            <article key={post.slug}>
              <span className="article-meta">{dateLabel(post.date)}</span>
              <Link href={`/blog/${post.slug}`}>
                <h3>{post.title}</h3>
                <ArrowUpRight size={22} strokeWidth={1.5} />
              </Link>
              <p>{post.summary}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
