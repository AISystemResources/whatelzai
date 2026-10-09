import type { Metadata } from "next";
import { AdminArea } from "@/components/admin/AdminArea";

export const metadata: Metadata = { title: "Day Job — Admin" };

export default function DayJobPage() {
  return (
    <AdminArea
      title="Day Job"
      description="A place for your work priorities, deadlines and follow-ups."
      links={[]}
    >
      <div className="rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold text-zinc-900">
          Choose what to track first
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          This section is ready to build around your workflow. No tasks or work
          data have been added yet.
        </p>
      </div>
    </AdminArea>
  );
}
