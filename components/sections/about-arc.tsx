const roles = [
  {
    period: "Jan – Jun 2023",
    company: "Setel Ventures",
    role: "Data Science Intern",
    highlights: [
      "Customer Topup Segmentation Model v2 — K-Means clustering, increased topup business value 25%",
      "Customer Fuel Segmentation Model v2 — multiple K-Means rounds, increased fuel business value 30%",
      "Fraud Detection Model refactor — reduced script-running duration 20%",
      "Gig-worker Prediction Model — semi-supervised ML, 80% accuracy",
    ],
    skills: ["Python", "Pandas", "Scikit-Learn", "K-Means", "Data Visualisation"],
  },
  {
    period: "May – Aug 2024",
    company: "AsiaVerify",
    role: "Product Management Intern",
    highlights: [
      "Integrated SE Asia company registries — Indonesia, Philippines, and other regional sources",
      "Shipped continuous monitoring feature for client compliance workflows",
      "Designed API request/response shapes for the core product (APIs sold to clients)",
      "Liaised across engineering, design, sales, and leadership to land the spec",
    ],
    skills: ["API Design", "Product Discovery", "Stakeholder Management", "UX Collaboration"],
  },
  {
    period: "May – Aug 2025",
    company: "Prudential Assurance Company Singapore",
    role: "AI Engineering Intern · First stint",
    highlights: [
      "Pioneered RAG + MCP Chatbot from the ground up for 5,000+ Financial Advisors",
      "Pioneered AI-Powered Distribution Dashboard — greenfield, no prior art internally",
      "Both products shipped; both still running in the current stint",
    ],
    skills: ["RAG", "MCP", "LLMs", "AI Engineering"],
  },
  {
    period: "Jan – Aug 2026",
    company: "Prudential Assurance Company Singapore",
    role: "AI Engineering Intern · Current",
    highlights: [
      "Model migration off deprecating models — zero-downtime transitions",
      "Token cost control and latency optimisation across both products",
      "Same two greenfield products, significantly deeper technical ownership",
    ],
    skills: ["Model Migration", "Cost Optimisation", "Latency Tuning", "Production AI"],
  },
] as const;

export function AboutArc() {
  return (
    <section
      id="about-arc"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32 dark:border-zinc-800"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
          Through-line
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Career timeline
        </h2>
        <p className="mt-6 max-w-2xl text-base text-zinc-700 dark:text-zinc-300">
          All past internship experiences — data science, product management, AI
          engineering — led to one identity: an individual capable of handling
          technical complexities while understanding the business considerations
          behind building a useful AI product.
        </p>

        <ol className="mt-16 space-y-0">
          {roles.map((stop, i) => (
            <li key={stop.period} className="relative">
              {i < roles.length - 1 && (
                <span
                  className="absolute top-[2.25rem] left-[0.3125rem] h-full w-px bg-zinc-200 dark:bg-zinc-800"
                  aria-hidden="true"
                />
              )}

              <div className="flex gap-6 pb-14">
                <div className="relative mt-1 flex-shrink-0">
                  <span
                    className="block h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-950"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                      {stop.period}
                    </p>
                  </div>

                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    {stop.company}
                  </h3>
                  <p
                    className="mt-0.5 font-mono text-xs tracking-wide uppercase"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {stop.role}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {stop.highlights.map((line) => (
                      <li
                        key={line}
                        className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                        {line}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {stop.skills.map((skill) => (
                      <span
                        key={skill}
                        className="border border-zinc-200 px-2 py-0.5 font-mono text-[10px] tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
