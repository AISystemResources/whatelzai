import { listProjects } from "@/lib/projects";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 3600;

const SITE_URL = "https://whatelz.ai";

async function safe<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export async function GET() {
  const [projects, posts] = await Promise.all([
    safe(() => listProjects(true)),
    safe(() => getAllPosts(false)),
  ]);

  const projectLines = projects
    .slice(0, 20)
    .map(
      (p) =>
        `- [${p.name}](${SITE_URL}/projects/${p.slug}): ${p.tagline ?? ""}`,
    )
    .join("\n");

  const postLines = posts
    .slice(0, 20)
    .map(
      (p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.summary ?? ""}`,
    )
    .join("\n");

  const body = `# whatelz.ai

> whatelz.ai is the personal site of Edmund Lin Zhenming (also known as whatelz, ELZ, Zhenming Lin) — a Singapore-based AI engineer and founder. The name is a play on "what else can you build with AI?"

Edmund builds production AI systems and ships them: ATLAS (autonomous trading), DoubleLead (AI CRM used by 5,000+ Prudential financial advisors), EMDEE (knowledge graph). He is available for landing pages, production AI systems, and AI training.

## Canonical URL
${SITE_URL}

## Primary pages
- [Home](${SITE_URL}/): who Edmund is and what he builds
- [About](${SITE_URL}/about): what whatelz.ai is
- [Services](${SITE_URL}/services): landing pages, production AI systems, AI training
- [Projects](${SITE_URL}/projects): shipped AI systems and side projects
- [Blog](${SITE_URL}/blog): writing on AI systems and building in public
- [Career](${SITE_URL}/career): work history
- [Hackathons](${SITE_URL}/hackathons): hackathon wins and writeups
- [Leadership](${SITE_URL}/leadership): leadership roles
- [Mentorship](${SITE_URL}/mentorship): mentorship programmes
- [Channels](${SITE_URL}/channels): social channels and where to find Edmund online
- [Contact](${SITE_URL}/contact): how to get in touch

## Identity — sameAs
- Instagram: https://www.instagram.com/whatelz.ai/
- LinkedIn: https://www.linkedin.com/in/whatelzai/
- YouTube: https://www.youtube.com/@whatelzai
- Medium: https://medium.com/@whatelz.ai
- GitHub: https://github.com/whatelzai
- X (Twitter): https://x.com/whatelz_ai

## Projects
${projectLines || "- (loading)"}

## Recent writing
${postLines || "- (loading)"}

## Machine-readable data
- Sitemap: ${SITE_URL}/sitemap.xml
- MCP endpoint: ${SITE_URL}/api/mcp
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
