import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { loadLead } from "@/lib/leads/server";
import { ageOn, dateLabel } from "@/lib/leads/model";
import { MemberNav } from "@/components/culture/MemberNav";
import {
  LeadEditor,
  NewActivity,
  ActivityStatus,
} from "@/components/leads/LeadForms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lead profile",
  robots: { index: false, follow: false },
};
export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  if (!(await ensureUserRow()))
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/leads/${id}`)}`);
  const data = await loadLead(id);
  if (!data) notFound();
  const age = ageOn(data.lead.birthday);
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-8">
      <MemberNav current="/leads" />
      <header>
        <Link href="/leads" className="text-sm underline">
          ← All leads
        </Link>
        <p className="mt-4 text-sm text-zinc-500">Private to you</p>
        <h1 className="mt-2 text-3xl font-semibold">{data.lead.name}</h1>
        {age !== null && <p className="mt-2 text-zinc-500">Age {age}</p>}
      </header>
      <LeadEditor lead={data.lead} />
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Activity history</h2>
        <p className="text-sm text-zinc-500">
          Your personal record. Planned and “to invite” activities are not
          confirmed attendance or calendar bookings.
        </p>
        {data.activities.map((activity) => (
          <article key={activity.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold">{activity.title}</h3>
              <span className="rounded bg-zinc-100 px-2 py-1 text-sm">
                {activity.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {dateLabel(activity.activity_on)}
            </p>
            {activity.notes && (
              <p className="mt-2 whitespace-pre-wrap">{activity.notes}</p>
            )}
            <ActivityStatus key={activity.revision} activity={activity} />
          </article>
        ))}
        {!data.activities.length && (
          <p className="text-zinc-500">No activities recorded yet.</p>
        )}
        <NewActivity leadId={id} />
      </section>
    </main>
  );
}
