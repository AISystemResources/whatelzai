'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import type { Project } from "@/lib/projects";

function ProjectFeature({ project, index }: { project: Project; index: number }) {
  const flip = index % 2 !== 0;
  const num = String(index + 1).padStart(2, '0');

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      id={`project-${project.slug}`}
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={`flex flex-col gap-16 lg:items-start lg:gap-24 ${flip ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
        >
          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              {num} / Project
            </p>
            <h2 className="mt-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">
              {project.name}
            </h2>
            {project.tagline && (
              <p className="mt-4 text-lg text-zinc-600 sm:text-xl">{project.tagline}</p>
            )}
            {project.description && (
              <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-700">
                {project.description}
              </p>
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
          </div>

          {/* Right column: screenshot if available, else metrics grid */}
          {project.cover_image_url ? (
            <div className="w-full shrink-0 lg:w-80 xl:w-96">
              <div className="relative aspect-video overflow-hidden border border-zinc-200">
                <Image
                  src={project.cover_image_url}
                  alt={`${project.name} screenshot`}
                  fill
                  className="object-cover object-top"
                />
              </div>
              {project.status && (
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  <span style={{ color: 'var(--accent-text)' }} aria-hidden="true">
                    {project.status === 'active' ? '●' : '✓'}
                  </span>
                  {project.status}
                </p>
              )}
            </div>
          ) : project.metrics && project.metrics.length > 0 ? (
            <div className="w-full shrink-0 lg:w-80 xl:w-96">
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
            </div>
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
