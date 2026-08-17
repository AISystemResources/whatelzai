import { Hero } from "@/components/sections/hero";
import { MindsetSkillset } from "@/components/sections/mindset-skillset";
import { QuizCTA } from "@/components/sections/quiz-cta";
import { Intro } from "@/components/sections/intro";
// --- Sections parked during the solopreneur repositioning (sprint 074) ---
// Copy in these sections still speaks to "AI training for teams" and clashes
// with the new solopreneur/handbook thesis. Kept imported so we can flip them
// back on with a one-line change if the prototype doesn't stick.
// import { Provocation } from "@/components/sections/provocation";
// import { POV } from "@/components/sections/pov";
// import { TrackRecord } from "@/components/sections/track-record";
// import { TrainingOffer } from "@/components/sections/training-offer";
import { Testimonials } from "@/components/sections/testimonials";
import { getSiteIdentity } from "@/lib/site-identity";

export default async function Home() {
  const site = await getSiteIdentity();

  return (
    <main>
      <Hero />
      <MindsetSkillset />
      <QuizCTA />
      <Intro site={site} />
      <Testimonials />
      {/* Parked — see imports above. */}
      {/* <Provocation /> */}
      {/* <POV /> */}
      {/* <TrackRecord /> */}
      {/* <TrainingOffer /> */}
    </main>
  );
}
