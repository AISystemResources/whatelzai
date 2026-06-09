import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";
import { ShellProvider } from "@/components/shell/ShellProvider";
import { supabaseAdmin } from "@/lib/supabase-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const SITE_URL = "https://whatelz.ai";
const SITE_TITLE = "whatelz.ai — Edmund Lin Zhenming";
const SITE_DESCRIPTION =
  "What else can you build with AI? Edmund Lin Zhenming is an AI engineer and founder building ATLAS (trading AI), DoubleLead (CRM AI), and EMDEE (knowledge graph). Available for landing pages, production AI systems, and AI training.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — whatelz.ai",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI engineer",
    "build with AI",
    "what else can you build with AI",
    "AI systems",
    "production AI",
    "AI training",
    "landing pages Next.js",
    "Edmund Lin Zhenming",
    "whatelz",
    "ATLAS trading AI",
    "DoubleLead CRM",
    "EMDEE knowledge graph",
  ],
  applicationName: "whatelz.ai",
  authors: [{ name: "Edmund Lin Zhenming", url: SITE_URL }],
  creator: "Edmund Lin Zhenming",
  openGraph: {
    type: "profile",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "whatelz.ai",
    firstName: "Edmund",
    lastName: "Lin Zhenming",
    username: "whatelzai",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@whatelzai",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Edmund Lin Zhenming",
      url: SITE_URL,
      jobTitle: "AI Engineer & Founder",
      description:
        "AI engineer and founder building AI systems — ATLAS (autonomous trading), DoubleLead (AI CRM), and EMDEE (knowledge graph). What else can you build with AI?",
      sameAs: [
        "https://www.instagram.com/whatelz.ai/",
        "https://www.linkedin.com/in/whatelzai/",
        "https://www.youtube.com/@whatelzai",
        "https://medium.com/@whatelz.ai",
        "https://github.com/whatelzai",
      ],
      knowsAbout: [
        "Artificial Intelligence",
        "AI Systems Engineering",
        "Large Language Models",
        "Retrieval-Augmented Generation",
        "Next.js",
        "TypeScript",
        "Supabase",
        "AI Training",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "whatelz.ai",
      description: SITE_DESCRIPTION,
      author: { "@id": `${SITE_URL}/#person` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/services#service`,
      name: "whatelz.ai Services",
      url: `${SITE_URL}/services`,
      provider: { "@id": `${SITE_URL}/#person` },
      serviceType: ["Web Development", "AI Systems", "AI Training"],
      description:
        "Landing pages and sites, production AI systems, and AI training for individuals and businesses.",
    },
  ],
};

async function getIsAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    const { data } = await supabaseAdmin
      .from("system_config")
      .select("value")
      .eq("key", "clerk_admin_user_id")
      .single();
    return !!data?.value && userId === data.value;
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAdmin = await getIsAdmin();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <ShellProvider isAdmin={isAdmin}>
          {children}
        </ShellProvider>
      </body>
    </html>
  );
}
