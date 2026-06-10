'use client';

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/lib/projects";

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

function ProjectFeature({ project, index }: { project: Project; index: number }) {
  const reduced = useReducedMotion();
  const flip = index % 2 !== 0;
  const num = String(index + 1).padStart(2, '0');

  return (
    <motion.section
      variants={sectionVariants}
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      id={`project-${project.slug}`}
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className={`flex flex-col gap-16 lg:items-start lg:gap-20 ${flip ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>

          {/* Text */}
          <motion.div variants={slideUpVariants} className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              {num} / Project
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">
              {project.name}
            </h2>
            {project.tagline && (
              <p className="mt-4 text-lg text-zinc-600 sm:text-xl">{project.tagline}</p>
            )}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-1.5">
                {project.tech_stack.map((tech) => (
                  <li
                    key={tech}
                    className="border border-zinc-200 px-2 py-1 font-mono text-[10px] tracking-wide text-zinc-600"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            )}
            {project.external_url && (
              <a
                href={project.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
              >
                View live <span aria-hidden="true">↗</span>
              </a>
            )}
          </motion.div>

          {/* Right column: screenshot → metrics fallback */}
          {project.cover_image_url ? (
            <motion.div
              variants={scaleInVariants}
              className="w-full shrink-0 lg:w-[500px]"
            >
              <div className="group overflow-hidden rounded bg-zinc-950 shadow-xl transition-shadow duration-500 hover:shadow-2xl">
                {/* Browser chrome dots */}
                <div className="flex items-center gap-1.5 px-4 py-3" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                </div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={project.cover_image_url}
                    alt={`${project.name} screenshot`}
                    fill
                    loading="lazy"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
              </div>
              {project.status && (
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  <span style={{ color: 'var(--accent-text)' }} aria-hidden="true">
                    {project.status === 'active' ? '●' : '✓'}
                  </span>
                  {project.status}
                </p>
              )}
            </motion.div>
          ) : project.metrics && project.metrics.length > 0 ? (
            <motion.div
              variants={scaleInVariants}
              className="w-full shrink-0 lg:w-80 xl:w-96"
            >
              <dl className="grid grid-cols-2 gap-px bg-zinc-200">
                {project.metrics.map((m) => (
                  <div key={m.label} className="bg-white p-6">
                    <dt className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                      {m.label}
                    </dt>
                    <dd className="mt-2 text-2xl font-bold tracking-tight">{m.value}</dd>
                  </div>
                ))}
              </dl>
              {project.status && (
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  <span style={{ color: 'var(--accent-text)' }} aria-hidden="true">
                    {project.status === 'active' ? '●' : '✓'}
                  </span>
                  {project.status}
                </p>
              )}
            </motion.div>
          ) : null}

        </div>
      </div>
    </motion.section>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.map((p, i) => (
        <ProjectFeature key={p.slug} project={p} index={i} />
      ))}
    </>
  );
}
