import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteIdentity } from "@/lib/site-identity";
import { getAllPosts } from "@/lib/blog";
import { Testimonials } from "@/components/sections/testimonials";
import { BookObject, Eyebrow } from "@/components/editorial/FieldElements";
import { Pillars } from "@/components/editorial/Pillars";

export const metadata: Metadata = {
  title: { absolute: "whatelz.ai — The solopreneur’s playbook" },
  description:
    "Money Mindset × AI Skillset. Edmund’s field notes on building a life and business of your own, with AI by your side.",
  alternates: { canonical: "https://whatelz.ai" },
};
export default async function Home() {
  const [site, posts] = await Promise.all([getSiteIdentity(), getAllPosts()]);
  return (
    <main className="editorial-home">
      <section className="home-hero field-wrap">
        <div className="hero-copy">
          <Eyebrow>For the one-person possibility</Eyebrow>
          <h1>
            Make a living.
            <br />
            Build a life.
            <br />
            <em>On your terms.</em>
          </h1>
          <p>
            Money Mindset × AI Skillset.
            <br />
            I’m learning to make it as a solopreneur.
            <br />
            This is the playbook I’m writing along the way.
          </p>
          <div className="hero-actions">
            <Link href="/playbook" className="field-button">
              Explore the playbook <span>↗</span>
            </Link>
            <Link href="/about" className="text-link">
              Meet the person behind it <span>→</span>
            </Link>
          </div>
          <div className="hero-byline">
            {site.portrait_url && (
              <Image src={site.portrait_url} alt="" width={42} height={42} />
            )}
            <div>
              Hey, I’m {site.owner_first_name}.
              <small>Building in public. Figuring it out, too.</small>
            </div>
          </div>
        </div>
        <div className="hero-desk">
          <div className="desk-orbit" aria-hidden="true" />
          <span className="desk-caption">
            NOT THE FINISH LINE.
            <br />
            THE FIELD NOTES.
          </span>
          <div className="desk-note note-top">
            <span>Note to self / 001</span>You can give
            <br />
            yourself <em>100%, too.</em>
            <svg viewBox="0 0 140 30" aria-hidden="true">
              <path d="M4 20Q70 0 133 14M115 3l18 11-18 10" />
            </svg>
          </div>
          <BookObject />
          <div className="desk-note note-bottom">
            <span className="note-spark" aria-hidden="true">
              ✳
            </span>
            <div>
              One person.
              <br />
              <em>More possible.</em>
            </div>
          </div>
          <span className="desk-edition">THE PERSONAL EDITION — VOL. 01</span>
        </div>
      </section>
      <div className="thesis-strip">
        <div>
          <span>MONEY MINDSET</span>
          <b>×</b>
          <span>AI SKILLSET</span>
          <b>↗</b>
          <span>BUILD. LEARN. REPEAT.</span>
          <b>✳</b>
          <span>YOUR OWN WAY FORWARD</span>
        </div>
      </div>
      <section className="field-section field-wrap" id="philosophy">
        <div className="section-heading">
          <Eyebrow>01 / The foundation</Eyebrow>
          <h2>
            Ambition needs belief.
            <br />
            <em>Belief needs a way to build.</em>
          </h2>
          <p>
            Two things I keep coming back to. Two things I keep working on.
            Neither works quite as well without the other.
          </p>
        </div>
        <Pillars />
      </section>
      <section className="playbook-feature">
        <div className="field-wrap playbook-feature-grid">
          <div className="feature-book">
            <BookObject compact />
            <span className="margin-note">
              Read it. Question it.
              <br />
              Make it your own.
            </span>
          </div>
          <div>
            <Eyebrow>02 / Start here</Eyebrow>
            <h2>
              A playbook for
              <br />
              the <em>work in progress.</em>
            </h2>
            <p>
              My first digital product is also my working notebook. Lessons from
              books, building, selling and getting things wrong — brought
              together for the solopreneur I’m becoming.
            </p>
            <div className="feature-facts">
              <span>12 chapters</span>
              <span>Mindset + practical skills</span>
              <span>Open draft</span>
            </div>
            <Link href="/playbook" className="field-button">
              Turn the first page <span>↗</span>
            </Link>
            <p className="small-note">
              Explore the draft freely while I keep making it better.
            </p>
          </div>
        </div>
      </section>
      <section className="field-section field-wrap">
        <div className="section-heading horizontal">
          <div>
            <Eyebrow>03 / Behind the playbook</Eyebrow>
            <h2>
              I’m the first
              <br />
              <em>work in progress.</em>
            </h2>
          </div>
          <p>
            I’m {site.owner_first_name}, an AI builder based in Singapore. I’m
            putting my own ideas to work, sharing the useful bits and being
            honest about what I’m still learning.
          </p>
        </div>
        <div className="journey-grid">
          <Link href="/about" className="portrait-story">
            {site.portrait_url && (
              <Image
                src={site.portrait_url}
                alt={site.owner_name}
                fill
                sizes="(max-width: 700px) 90vw, 40vw"
                className="object-cover"
              />
            )}
            <div>
              <small>THE PERSON BEHIND THE PAGES</small>
              <span>Here’s my story. ↗</span>
            </div>
          </Link>
          <div className="journey-links">
            {[
              [
                "/projects",
                "01",
                "Things I’m building",
                "From an idea in my notes to something that works.",
              ],
              [
                "/blog",
                "02",
                "Things I’m learning",
                "On money, AI and the practice of working for yourself.",
              ],
              [
                "/this-week",
                "03",
                "The journey, as it happens",
                "Follow the experiments. Take the lessons with you.",
              ],
            ].map(([href, n, title, desc]) => (
              <Link href={href} key={href}>
                <small>{n}</small>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
                <span>↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="quote-interlude">
        <div className="field-wrap">
          <Eyebrow>A question I keep asking myself</Eyebrow>
          <blockquote>
            “If you can give your company 100%,
            <br />
            <em>why not give yourself 100%?”</em>
          </blockquote>
          <span>— A reminder to build something of your own.</span>
        </div>
      </section>
      <section className="field-section field-wrap">
        <div className="section-heading horizontal">
          <div>
            <Eyebrow>04 / Fresh from the notebook</Eyebrow>
            <h2>
              Thinking <em>out loud.</em>
            </h2>
          </div>
          <Link href="/blog" className="text-link">
            All field notes <span>↗</span>
          </Link>
        </div>
        {posts.length ? (
          <div className="note-grid">
            {posts.slice(0, 3).map((post, i) => (
              <Link
                href={`/blog/${post.slug}`}
                className="note-card"
                key={post.slug}
              >
                <span className="note-card-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <small>{post.tags[0] || "FIELD NOTES"}</small>
                <h3>{post.title}</h3>
                <p>{post.summary}</p>
                <span className="note-card-bottom">
                  Read the note <b>↗</b>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="notebook-empty">
            <h3>The next page is being written.</h3>
            <p>
              Start with the playbook, or follow along as new notes take shape.
            </p>
            <Link href="/this-week" className="text-link">
              Follow the journey →
            </Link>
          </div>
        )}
      </section>
      <div className="home-testimonials">
        <Testimonials />
      </div>
      <section className="field-wrap quiz-invitation">
        <div>
          <Eyebrow>Your next small step</Eyebrow>
          <h2>
            What kind of
            <br />
            <em>builder are you?</em>
          </h2>
          <p>A little self-awareness is a good place to begin.</p>
        </div>
        <Link href="/quiz" className="quiz-circle">
          <span>
            Find your
            <br />
            archetype
          </span>
          <b aria-hidden="true">↗</b>
        </Link>
      </section>
    </main>
  );
}
