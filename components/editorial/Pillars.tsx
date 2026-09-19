"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Workflow,
} from "lucide-react";
import Link from "next/link";

const pillars = [
  {
    name: "Money Mindset",
    subtitle: "Give yourself permission to build.",
    description:
      "The beliefs you carry shape the decisions you make. I’m working on how I think about money, recognise value, sell what I build and choose what deserves my time.",
    notes: [
      "Reframe what’s possible",
      "Understand value & selling",
      "Put your energy where it matters",
    ],
    symbol: "↗",
    tone: "money",
  },
  {
    name: "AI Skillset",
    subtitle: "Give your ambition a set of tools.",
    description:
      "Ideas get interesting when you can make them real. I’m learning to turn AI into working products, repeatable systems and a team that helps me do more on my own.",
    notes: [
      "Build something people can use",
      "Turn repeated work into systems",
      "Learn by shipping, then improving",
    ],
    symbol: "✳",
    tone: "skill",
  },
];
export function Pillars() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const p = pillars[active];
  return (
    <div className="pillar-workbench">
      <div className="pillar-switch" aria-label="Explore the two pillars">
        {pillars.map((item, i) => (
          <button
            key={item.name}
            onClick={() => setActive(i)}
            aria-pressed={active === i}
            aria-controls="pillar-content"
          >
            {item.name}
            <span aria-hidden="true">
              {active === i ? (
                <ArrowDownRight size={22} />
              ) : (
                <ArrowUpRight size={22} />
              )}
            </span>
          </button>
        ))}
      </div>
      <motion.div
        id="pillar-content"
        key={p.name}
        className={`pillar-content ${p.tone}`}
        initial={reduced ? false : { opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="pillar-art" aria-hidden="true">
          <span>
            {active === 0 ? (
              <TrendingUp size={160} strokeWidth={1} />
            ) : (
              <Workflow size={150} strokeWidth={1} />
            )}
          </span>
          <small>
            {active === 0
              ? "THINK BIGGER. START SMALLER."
              : "ONE PERSON. MORE POSSIBLE."}
          </small>
        </div>
        <div className="pillar-copy">
          <h3>{p.subtitle}</h3>
          <p>{p.description}</p>
          <ul>
            {p.notes.map((n) => (
              <li key={n}>
                <ArrowUpRight size={16} aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
          <Link href="/playbook" className="text-link">
            Explore it in the playbook <span>→</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
