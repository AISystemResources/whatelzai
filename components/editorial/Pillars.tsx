"use client";
import { useState } from "react";
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
            <span>0{i + 1}</span>
            {item.name}
            <span aria-hidden="true">{active === i ? "↘" : "↗"}</span>
          </button>
        ))}
      </div>
      <div id="pillar-content" className={`pillar-content ${p.tone}`}>
        <div className="pillar-art" aria-hidden="true">
          <span>{p.symbol}</span>
          <small>
            {active === 0
              ? "THINK BIGGER. START SMALLER."
              : "ONE PERSON. MORE POSSIBLE."}
          </small>
        </div>
        <div className="pillar-copy">
          <span className="field-eyebrow">{p.name}</span>
          <h3>{p.subtitle}</h3>
          <p>{p.description}</p>
          <ul>
            {p.notes.map((n) => (
              <li key={n}>
                <span aria-hidden="true">↗</span>
                {n}
              </li>
            ))}
          </ul>
          <Link href="/playbook" className="text-link">
            Explore it in the playbook <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
