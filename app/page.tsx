import { Hero } from "@/components/sections/hero";
import { Arc } from "@/components/sections/arc";
import { Projects } from "@/components/sections/projects";
import { Wins } from "@/components/sections/wins";
import { BuildingInPublic } from "@/components/sections/building-in-public";
import { Contact } from "@/components/sections/contact";
import { listHackathons } from "@/lib/hackathons";
import { listCareer } from "@/lib/career";
import { listProjects } from "@/lib/projects";

export default async function Home() {
  const [hackathons, career, projects] = await Promise.all([
    listHackathons(true),
    listCareer(true),
    listProjects(true),
  ]);

  return (
    <main>
      <Hero />
      <Projects projects={projects} />
      <Arc entries={career} />
      <Wins hackathons={hackathons} />
      <BuildingInPublic />
      <Contact />
    </main>
  );
}
