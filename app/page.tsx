import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { getSiteIdentity } from "@/lib/site-identity";
import { getAllPosts } from "@/lib/blog";
import { listFeaturedTestimonials, testimonialSlug } from "@/lib/testimonials";
import { BookObject, Eyebrow } from "@/components/editorial/FieldElements";
import { Pillars } from "@/components/editorial/Pillars";
import { BookTilt, Reveal } from "@/components/editorial/MotionDetails";
import { ArticleSelection } from "@/components/editorial/ArticleSelection";
import { ReaderVoices } from "@/components/editorial/ReaderVoices";

export const metadata: Metadata = {
  title: { absolute: "whatelz.ai — The solopreneur’s playbook" },
  description:
    "Money Mindset × AI Skillset. Edmund’s field notes on building a life and business of your own, with AI by your side.",
  alternates: { canonical: "https://whatelz.ai" },
};
export default async function Home() {
  const [site, posts, testimonials] = await Promise.all([
    getSiteIdentity(),
    getAllPosts(),
    listFeaturedTestimonials(),
  ]);
  const voices = testimonials.slice(0, 5).map((t) => ({
    name: t.author_name,
    role: (t.author_affiliations ?? [])
      .map((a) => [a.role, a.company].filter(Boolean).join(", "))
      .join(" · "),
    quote: t.quote,
    avatar: t.author_avatar_url,
    href: `/testimonials/${testimonialSlug(t)}`,
  }));
  return (
    <main className="editorial-home taste-home">
      <section className="home-hero field-wrap">
        <div className="hero-copy">
          <Eyebrow>Money Mindset × AI Skillset</Eyebrow>
          <h1>
            Build a life.
            <br />
            On your terms.
          </h1>
          <p>
            I’m learning to make it as a solopreneur. This is the playbook I’m
            writing along the way.
          </p>
          <div className="hero-actions">
            <Link href="/playbook" className="field-button">
              Explore the playbook <ArrowUpRight size={21} strokeWidth={1.5} />
            </Link>
            <Link href="/about" className="text-link">
              Meet Edmund <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="hero-desk">
          <BookTilt>
            <BookObject />
          </BookTilt>
        </div>
      </section>
      <section className="field-section field-wrap" id="philosophy">
        <Reveal>
          <div className="section-heading">
            <h2>
              Think differently.
              <br />
              Then make something real.
            </h2>
            <p>
              The beliefs behind the decisions. The skills to act on them. I’m
              working on both.
            </p>
          </div>
          <Pillars />
        </Reveal>
      </section>
      <section className="playbook-feature">
        <div className="field-wrap playbook-feature-grid">
          <figure className="learning-image">
            <Image
              src="/images/editorial/learning-still-life.png"
              alt="Open notebook and pencil beside olive and ochre cloth-bound books"
              width={1536}
              height={1024}
              sizes="(max-width:768px) 100vw, 50vw"
            />
            <figcaption>Read. Try. Reflect. Repeat.</figcaption>
          </figure>
          <div>
            <Eyebrow>The playbook</Eyebrow>
            <h2>
              Useful lessons.
              <br />
              Still being learned.
            </h2>
            <p>
              My first digital product brings together what I’m learning about
              money, selling and building with AI. Twelve chapters, open for you
              to explore.
            </p>
            <div className="feature-facts">
              <span>12 chapters</span>
              <span>Money Mindset + AI Skillset</span>
            </div>
            <Link href="/playbook" className="text-link">
              Read the open draft <ArrowUpRight size={20} />
            </Link>
          </div>
        </div>
      </section>
      <section className="field-section field-wrap">
        <Reveal className="journey-grid">
          <div className="portrait-column">
            <Link href="/about" className="portrait-story">
              {site.portrait_url && (
                <Image
                  src={site.portrait_url}
                  alt={site.owner_name}
                  fill
                  sizes="(max-width:768px) 90vw, 40vw"
                  className="object-cover"
                />
              )}
            </Link>
            <p className="portrait-caption">
              {site.owner_name}
              <Link href="/about">
                My story <ArrowUpRight size={17} />
              </Link>
            </p>
          </div>
          <div className="journey-copy">
            <h2>
              I’m building this
              <br />
              as I go.
            </h2>
            <p>
              I’m {site.owner_first_name}, an AI builder in Singapore. I share
              what I’m making, what’s helping and what I’m still figuring out.
            </p>
            <div className="journey-links">
              {[
                [
                  "/projects",
                  "Things I’m building",
                  "Products and systems I’m putting to work.",
                ],
                [
                  "/blog",
                  "Things I’m learning",
                  "Writing about money, AI and working for yourself.",
                ],
                [
                  "/this-week",
                  "Follow the journey",
                  "The experiments and lessons, as they happen.",
                ],
              ].map(([href, title, desc]) => (
                <Link href={href} key={href}>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                  <ArrowUpRight size={21} />
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
      <section className="quote-interlude">
        <div className="field-wrap">
          <blockquote>
            “If you can give your company 100%, why not give yourself 100%?”
          </blockquote>
          <p>A question I keep asking myself.</p>
        </div>
      </section>
      <section className="field-section field-wrap">
        <Reveal>
          <div className="section-heading article-heading">
            <h2>Latest writing.</h2>
            <Link href="/blog" className="text-link">
              All articles <ArrowUpRight size={18} />
            </Link>
          </div>
          <ArticleSelection posts={posts.slice(0, 3)} />
        </Reveal>
      </section>
      <ReaderVoices voices={voices} />
      <section className="field-wrap quiz-invitation">
        <div>
          <h2>Find your starting point.</h2>
          <p>Take a short quiz to discover your solopreneur archetype.</p>
        </div>
        <Link href="/quiz" className="field-button">
          Find your archetype <ArrowUpRight size={21} />
        </Link>
      </section>
    </main>
  );
}
