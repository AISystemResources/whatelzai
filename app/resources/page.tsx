import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { isOwnerUser } from "@/lib/admin-policy";
import { MemberNav } from "@/components/culture/MemberNav";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Resources · fcOS",
  robots: { index: false, follow: false },
};
export default async function Resources() {
  const user = await ensureUserRow();
  if (!user) redirect("/sign-in");
  return (
    <main className="mx-auto max-w-4xl space-y-7 px-5 py-8">
      <MemberNav current="/resources" />
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          fcOS · Resources
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Learn. Prepare. Connect.
        </h1>
        <p className="mt-3 text-zinc-600">
          Useful references for the conversations and experiences ahead.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            href: "/briefings",
            title: "HQH & HHH",
            body: "Your pre-briefings and takeaways, linked to leads and events. Read notes shared with you here too.",
          },
          {
            href: "/catalogue",
            title: "Products",
            body: "Malaysia and Singapore product references, published prices and PV/BV.",
          },
          {
            href: "/calendar",
            title: "Calendar",
            body: "Community activities visible to your membership. Saved schedule, not live availability.",
          },
          {
            href: "/culture",
            title: "Culture",
            body: "超凡 wise words, with space for 顺育 and Founder’s Club.",
          },
          {
            href: "/team",
            title: "My team",
            body: "Explore the sponsor relationships your account is permitted to see.",
          },
          ...(isOwnerUser(user)
            ? [
                {
                  href: "/assistant/commitments",
                  title: "Commitments",
                  body: "Review and complete the next steps you accepted in chat.",
                },
                {
                  href: "/assistant/connections",
                  title: "Knowledge connection",
                  body: "Manage your optional EMDEE collection.",
                },
              ]
            : []),
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border p-6"
          >
            <h2 className="text-xl font-semibold">{item.title} →</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{item.body}</p>
          </Link>
        ))}
      </div>
      <Link
        href="/assistant"
        className="inline-block rounded-xl bg-yellow-300 px-5 py-3 font-medium"
      >
        Ask in chat →
      </Link>
    </main>
  );
}
