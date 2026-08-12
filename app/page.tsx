import { Hero } from "@/components/sections/hero";
import { QuizCTA } from "@/components/sections/quiz-cta";
import { Intro } from "@/components/sections/intro";
import { Provocation } from "@/components/sections/provocation";
import { POV } from "@/components/sections/pov";
import { TrackRecord } from "@/components/sections/track-record";
import { Testimonials } from "@/components/sections/testimonials";
import { TrainingOffer } from "@/components/sections/training-offer";
import { getSiteIdentity } from "@/lib/site-identity";

export default async function Home() {
  const site = await getSiteIdentity();

  return (
    <main>
      <Hero />
      <QuizCTA />
      <Intro site={site} />
      <Testimonials />
      <Provocation />
      <POV />
      <TrackRecord />
      <TrainingOffer />
    </main>
  );
}
