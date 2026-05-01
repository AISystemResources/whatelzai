import { Hero } from "@/components/sections/hero";
import { Arc } from "@/components/sections/arc";
import { Projects } from "@/components/sections/projects";
import { Wins } from "@/components/sections/wins";
import { Channels } from "@/components/sections/channels";
import { Contact } from "@/components/sections/contact";
import { listHackathons } from "@/lib/hackathons";
import { listCareer } from "@/lib/career";

export default async function Home() {
  const [hackathons, career] = await Promise.all([
    listHackathons(true),
    listCareer(true),
  ]);

  return (
    <main>
      <Hero />
      <Arc entries={career} />
      <Projects />
      <Wins hackathons={hackathons} />
      <Channels />
      <Contact />
    </main>
  );
}
