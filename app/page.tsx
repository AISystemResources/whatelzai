import { Hero } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { Arc } from "@/components/sections/arc";
import { Projects } from "@/components/sections/projects";
import { Wins } from "@/components/sections/wins";
import { Contact } from "@/components/sections/contact";
import { listHackathons } from "@/lib/hackathons";
import { listCareer } from "@/lib/career";
import { listProjects } from "@/lib/projects";
import { getSiteIdentity } from "@/lib/site-identity";

export default async function Home() {
  const [hackathons, career, projects, site] = await Promise.all([
    listHackathons(true),
    listCareer(true),
    listProjects(true),
    getSiteIdentity(),
  ]);

  return (
    <main>
      <Hero />
      <Intro site={site} />
      <Projects projects={projects} />
      <Arc entries={career} />
      <Wins hackathons={hackathons} />
      <Contact />
    </main>
  );
}
