import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { MemberNav } from "@/components/culture/MemberNav";
import { SignOutButton } from "@/components/auth/AuthControls";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Profile · fcOS",
  robots: { index: false, follow: false },
};
export default async function Profile() {
  const user = await ensureUserRow();
  if (!user) redirect("/sign-in");
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
      <MemberNav current="/profile" />
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Your fcOS account
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Profile</h1>
      </header>
      <section className="rounded-3xl border p-6">
        <h2 className="text-xl font-semibold">{user.name || "Your account"}</h2>
        <p className="mt-2 break-words text-zinc-500">{user.email}</p>
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          Your notes and lead records are private unless you explicitly share an
          individual note. Signing in does not automatically link your account
          to a person in the team tree.
        </p>
      </section>
      <Link href="/team" className="block rounded-xl border p-4">
        View my team →
      </Link>
      <SignOutButton />
    </main>
  );
}
