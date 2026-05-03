import { Hero } from "@/components/sections/hero";
import { Arc } from "@/components/sections/arc";
import { Projects } from "@/components/sections/projects";
import { Wins } from "@/components/sections/wins";
import { LeadershipSection } from "@/components/sections/leadership";
import { MentorshipSection } from "@/components/sections/mentorship";
import { Channels } from "@/components/sections/channels";
import { Contact } from "@/components/sections/contact";
import { listHackathons } from "@/lib/hackathons";
import { listCareer } from "@/lib/career";
import { listProjects } from "@/lib/projects";
import { listChannels } from "@/lib/channels";
import { listLeadership } from "@/lib/leadership";
import { listMentorship } from "@/lib/mentorship";

export default async function Home() {
  const [hackathons, career, projects, channels, leadership, mentorship] = await Promise.all([
    listHackathons(true),
    listCareer(true),
    listProjects(true),
    listChannels(true),
    listLeadership(true),
    listMentorship(true),
  ]);

  return (
    <main>
      <Hero />
      <Arc entries={career} />
      <Projects projects={projects} />
      <Wins hackathons={hackathons} />
      <LeadershipSection entries={leadership} />
      <MentorshipSection entries={mentorship} />
      <Channels channels={channels} />
      <Contact />
    </main>
  );
}
