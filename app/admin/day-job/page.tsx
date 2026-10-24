import { Suspense } from "react";
import { SprintFocus } from "@/components/admin/SprintFocus";
import type { Metadata } from "next";
import { AdminArea } from "@/components/admin/AdminArea";

export const metadata: Metadata = { title: "Day Job — Admin" };

export default function DayJobPage() {
  return (
    <AdminArea
      title="Day Job"
      description="AsiaVerify. One work block at a time."
      intro={
        <Suspense
          fallback={
            <p className="text-sm text-zinc-500">Reading your focus…</p>
          }
        >
          <SprintFocus lane="day-job" />
        </Suspense>
      }
      links={[]}
    />
  );
}
