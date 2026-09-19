"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SiteFooter({ ownerName }: { ownerName: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="editorial-footer">
      <div className="field-wrap">
        <div className="footer-top">
          <div>
            <h2>
              Follow what I’m
              <br />
              building and learning.
            </h2>
            <Link href="/this-week" className="field-button">
              Follow the journey <span>↗</span>
            </Link>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/playbook">The playbook</Link>
            <Link href="/about">My story</Link>
            <Link href="/projects">Things I’m building</Link>
            <Link href="/blog">Field notes</Link>
            <Link href="/contact">Say hello ↗</Link>
          </nav>
          <nav aria-label="Social links">
            <a
              href="https://www.instagram.com/whatelz.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram ↗
            </a>
            <a
              href="https://www.linkedin.com/in/whatelzai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              href="https://www.youtube.com/@whatelzai"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube ↗
            </a>
            <a
              href="https://medium.com/@whatelz.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              Medium ↗
            </a>
            <Link href="/channels">All channels →</Link>
          </nav>
        </div>
        <Link href="/" className="footer-wordmark" aria-label="whatelz.ai home">
          whatelz<span>↗</span>
        </Link>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {ownerName}
          </span>
          <span>Money Mindset × AI Skillset</span>
          <span>Built with curiosity. In Singapore.</span>
        </div>
      </div>
    </footer>
  );
}
