import type { Metadata } from "next";
import {
  getProvocationContent,
  getPovContent,
  getTrackRecordContent,
  getTrainingOfferContent,
} from "@/lib/landing-content";
import { ProvocationForm } from "./forms/ProvocationForm";
import { PovForm } from "./forms/PovForm";
import { TrackRecordForm } from "./forms/TrackRecordForm";
import { TrainingOfferForm } from "./forms/TrainingOfferForm";

export const metadata: Metadata = {
  title: "Landing content — whatelz.ai Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const [provocation, pov, trackRecord, trainingOffer] = await Promise.all([
    getProvocationContent(),
    getPovContent(),
    getTrackRecordContent(),
    getTrainingOfferContent(),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Landing
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Homepage content
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edit the four homepage sections. Wrap yellow words in{" "}
          <code className="font-mono text-xs text-zinc-700">
            {"{{accent:foo}}"}
          </code>
          . Use{" "}
          <code className="font-mono text-xs text-zinc-700">\n</code> in
          headings for line breaks. Changes appear on the homepage on next
          request.
        </p>
      </div>

      <ProvocationForm initial={provocation} />
      <PovForm initial={pov} />
      <TrackRecordForm initial={trackRecord} />
      <TrainingOfferForm initial={trainingOffer} />
    </div>
  );
}
