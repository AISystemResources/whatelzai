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
  "AI engineer and founder. Building ATLAS, DoubleLead, and EMDEE — AI systems for people who move fast.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — whatelz.ai",
  },
  description: SITE_DESCRIPTION,
  applicationName: "whatelz.ai",
  authors: [{ name: "Edmund Lin Zhenming" }],
  creator: "Edmund Lin Zhenming",
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "whatelz.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <ShellProvider isAdmin={isAdmin}>
          {children}
        </ShellProvider>
      </body>
    </html>
  );
}
