import type { Metadata } from "next";
import { requireAdmin } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import { loadTeamView, type TeamView } from "@/lib/team/server";
import { TeamTree } from "@/components/team/TeamTree";
import { linkTeamAccount, updateTeamPerson } from "./actions";

export const metadata: Metadata = {
  title: "Team relationships",
  robots: { index: false, follow: false },
};

export default async function TeamPage() {
  await requireAdmin();
  let view: TeamView | null;
  try {
    view = await loadTeamView();
  } catch {
    return (
      <div className="max-w-2xl space-y-3">
        <h1 className="text-2xl font-semibold">Team relationships</h1>
        <p className="text-zinc-500">
          Team data is unavailable. Check the database connection and
          relationship migration.
        </p>
      </div>
    );
  }
  if (!view)
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Team relationships</h1>
        <p className="text-zinc-500">
          No team has been imported yet. Import the private sponsor tree to get
          started.
        </p>
      </div>
    );
  const [accounts, links] = await Promise.all([
    supabaseAdmin.from("users").select("id,email,name").order("name"),
    supabaseAdmin
      .from("business_team_accounts")
      .select("person_id,user_id,access_role")
      .eq("team_id", view.team.id),
  ]);
  if (accounts.error || links.error)
    throw new Error("Account links could not be loaded");
  const linkedPeople = new Set(
    (links.data ?? []).map((link) => link.person_id),
  );
  const linkedUsers = new Set((links.data ?? []).map((link) => link.user_id));
  const peopleToLink = view.people.filter(
    (person) => !linkedPeople.has(person.id),
  );
  const usersToLink = (accounts.data ?? []).filter(
    (user) => !linkedUsers.has(user.id),
  );
  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-400">Team</p>
        <h1 className="mt-2 text-3xl font-semibold">{view.team.name}</h1>
        <p className="mt-3 text-sm text-zinc-500">
          {view.people.length} people ·{" "}
          {view.people.filter((person) => person.sponsor_person_id).length}{" "}
          sponsor links. Placement describes business relationships; it does not
          grant admin access.
        </p>
      </header>
      <TeamTree
        people={view.people}
        focusId={view.team.focus_person_id}
        canSeeAll
      />
      <section className="space-y-4 rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-semibold">Member details</h2>
        <p className="text-sm text-zinc-500">
          Add known email addresses and ABO numbers. Emails are admin-only; ABO
          numbers appear beside people in permitted team views. Saving an email
          does not link a login account.
        </p>
        <div className="space-y-4">
          {view.people.map((person) => (
            <form
              key={person.id}
              action={updateTeamPerson}
              className="space-y-3 rounded-lg border border-zinc-200 p-4"
            >
              <input type="hidden" name="team_id" value={view.team.id} />
              <input type="hidden" name="person_id" value={person.id} />
              <h3 className="font-medium">{person.display_name}</h3>
              {person.context ? (
                <p className="text-xs text-zinc-500">{person.context}</p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Email
                  <input
                    type="email"
                    name="email"
                    maxLength={254}
                    defaultValue={person.email ?? ""}
                    className="mt-1 block w-full rounded border border-zinc-300 p-2"
                  />
                </label>
                <label className="text-sm">
                  ABO number
                  <input
                    type="text"
                    name="abo_number"
                    inputMode="numeric"
                    pattern="[0-9]{1,20}"
                    maxLength={20}
                    defaultValue={person.abo_number ?? ""}
                    className="mt-1 block w-full rounded border border-zinc-300 p-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
              >
                Save details
              </button>
            </form>
          ))}
        </div>
      </section>
      <section className="space-y-4 rounded-xl border border-zinc-200 p-5">
        <h2 className="text-lg font-semibold">Link a verified account</h2>
        <p className="text-sm text-zinc-500">
          Confirm the account belongs to the person before linking. Matching
          names alone are not proof. Members see their direct upline and
          downline branch; team managers see the full tree.
        </p>
        {peopleToLink.length > 0 && usersToLink.length > 0 ? (
          <form action={linkTeamAccount} className="space-y-4">
            <input type="hidden" name="team_id" value={view.team.id} />
            <label className="block text-sm">
              Person
              <select
                required
                name="person_id"
                defaultValue=""
                className="mt-1 block w-full rounded border border-zinc-300 bg-white p-2"
              >
                <option disabled value="">
                  Choose person
                </option>
                {peopleToLink.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.display_name}
                    {person.context ? ` — ${person.context}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Signed-in account
              <select
                required
                name="user_id"
                defaultValue=""
                className="mt-1 block w-full rounded border border-zinc-300 bg-white p-2"
              >
                <option disabled value="">
                  Choose account
                </option>
                {usersToLink.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || "Account"} — {user.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Team visibility
              <select
                name="access_role"
                defaultValue="member"
                className="mt-1 block w-full rounded border border-zinc-300 bg-white p-2"
              >
                <option value="member">Member — own branch</option>
                <option value="manager">Team manager — full tree</option>
              </select>
            </label>
            <button
              className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
              type="submit"
            >
              Link account
            </button>
          </form>
        ) : (
          <p className="text-sm text-zinc-500">
            {peopleToLink.length === 0
              ? "All people have linked accounts."
              : "No unlinked accounts yet. People can sign in to create their account first."}
          </p>
        )}
        {(links.data ?? []).length > 0 && (
          <ul className="space-y-2 text-sm">
            {links.data!.map((link) => (
              <li key={link.person_id}>
                {
                  view.people.find((person) => person.id === link.person_id)
                    ?.display_name
                }{" "}
                ·{" "}
                {accounts.data?.find((user) => user.id === link.user_id)?.email}{" "}
                · {link.access_role}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
