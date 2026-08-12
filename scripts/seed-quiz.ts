// Seeds the "what-kind-of-solopreneur" HVCO quiz.
// Idempotent: safe to re-run — upserts on slug/key/sort_order uniques.
// Runs against the DB configured by NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

import { supabaseAdmin } from "../lib/supabase-server";

const QUIZ_SLUG = "what-kind-of-solopreneur";

const ARCHETYPES = [
  {
    key: "CAUTIOUS-EXPLORER",
    name: "The Cautious Explorer",
    sort_order: 1,
    one_line:
      "You know AI matters, but you're being careful about where to invest first. That's not fear — that's judgment. The next move is orientation, not tools.",
    full_report_md:
      "You're not behind — you're deliberate.\n\nThe pattern that defines you: you'd rather move once, correctly, than move three times reactively. That's a strength most of your peers don't have.\n\nWhat's blocking you isn't laziness or fear — it's the absence of a map. Every 'AI for solopreneurs' post you read is either too hype-y ('automate everything!') or too technical ('vector embeddings for beginners').\n\nWhat you actually need: a personalised assessment of where AI fits your business specifically. Not a generic playbook.\n\nThe next 30 days: pick ONE workflow you touch daily. Build the AI-assisted version of it. Ship it. Measure what changed. Then decide whether to expand.",
  },
  {
    key: "CEILING-BREAKER",
    name: "The Ceiling Breaker",
    sort_order: 2,
    one_line:
      "You've optimised what a single person can optimise. The ceiling isn't your skill or your tools — it's you. That's the frontier where leverage actually starts.",
    full_report_md:
      "You've done the hard work already.\n\nYour playbooks are refined. Your systems compound. You know what works because you have five years of data on what doesn't. The frustration you feel isn't performance — it's physics. There are only 24 hours.\n\nThe leverage you need next isn't more efficiency in what you do. It's a version of you that can be in three places at once — without hiring a team, without the overhead of managing humans.\n\nThe next 30 days: identify the one recurring judgement call you make daily that a well-designed AI can shadow. Not replace — shadow. Give it your inputs, see its outputs, correct it, watch it converge. That's the shape of your ceiling break.",
  },
  {
    key: "CHAOS-OPERATOR",
    name: "The Chaos Operator",
    sort_order: 3,
    one_line:
      "You're the bottleneck. Everything routes through you and you know it. The problem isn't willpower — it's that untangling requires slowing down, and you can't afford to slow down.",
    full_report_md:
      "You're running a business that requires you to be everywhere.\n\nSales, delivery, support, admin, finance — every hat sits on your head. You've tried the tools. You've tried the frameworks. They collapse the moment client work spikes.\n\nThe way out isn't 'better productivity.' It's ruthless subtraction, then AI as the delegation layer for what remains. Not a virtual assistant. Not another SaaS. A system that catches the things you drop.\n\nThe next 30 days: pick the ONE recurring task you resent most. Not the biggest — the most resented. Automate that one. The relief compounds. Then the next one. You cannot untangle everything at once, but you can untangle one thing this week.",
  },
  {
    key: "SYSTEMS-ARCHITECT",
    name: "The Systems Architect",
    sort_order: 4,
    one_line:
      "You've built the pieces. What's missing is the machine — the connective tissue that makes them work as one. That's a different skill than building the pieces.",
    full_report_md:
      "You have a workshop full of powerful tools.\n\nAutomations here, prompts there, a Zapier zap that saved you 4 hours last month, a Notion database that almost works, a Retool app you started. Each piece is competent. Together, they're an archipelago.\n\nThe frustration you feel is real: your tools generate friction between each other. Data gets copy-pasted. State lives in three places. When one thing changes, three things break.\n\nThe next 30 days: pick one workflow that touches THREE of your existing tools. Design the single system that would replace all three. Ship it — even a rough version. The point isn't perfect architecture; it's the discipline of consolidation.",
  },
];

const QUESTIONS = [
  {
    sort_order: 1,
    prompt:
      "When you think about 'using more AI in your business,' your first feeling is…",
    choices: [
      {
        label: "Excited but overwhelmed — where do I even start?",
        weights: { "CAUTIOUS-EXPLORER": 3 },
      },
      {
        label:
          "Impatient — I've optimised everything I can, need the next lever.",
        weights: { "CEILING-BREAKER": 3 },
      },
      {
        label: "Guilty — I know I should, but I'm buried in the day-to-day.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label:
          "Curious — I've built a few things, but they don't talk to each other.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
  {
    sort_order: 2,
    prompt: "Your calendar this week looks like…",
    choices: [
      {
        label:
          "Mostly research and reading — I want to understand before I commit.",
        weights: { "CAUTIOUS-EXPLORER": 3 },
      },
      {
        label: "Every hour is client work; I'm already at max capacity.",
        weights: { "CEILING-BREAKER": 3 },
      },
      {
        label: "Back-to-back with no gaps — my inbox is on fire.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label:
          "Half meetings, half a personal automation project I keep tinkering with.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
  {
    sort_order: 3,
    prompt: "The last thing you built with AI was…",
    choices: [
      {
        label: "I haven't yet — I'm still figuring out what to use.",
        weights: { "CAUTIOUS-EXPLORER": 3 },
      },
      {
        label:
          "A better prompt for something I already do — squeezed a bit more out of my day.",
        weights: { "CEILING-BREAKER": 3 },
      },
      {
        label: "Nothing this month; I keep meaning to but the day eats me.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label:
          "A workflow that connects two things — but it's fragile and only I know how it works.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
  {
    sort_order: 4,
    prompt: "When a new client asks 'what's your process?', you say…",
    choices: [
      {
        label: "I'm still shaping it — every engagement is a bit different.",
        weights: { "CAUTIOUS-EXPLORER": 2, "CHAOS-OPERATOR": 1 },
      },
      {
        label:
          "Here's the exact playbook — I've refined it over dozens of engagements.",
        weights: { "CEILING-BREAKER": 3 },
      },
      {
        label:
          "Depends — every client is different, we'll figure it out together.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label:
          "I have the pieces documented; delivery is where it gets ad-hoc.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
  {
    sort_order: 5,
    prompt: "Your biggest business bottleneck right now is…",
    choices: [
      {
        label:
          "Not knowing which of the many possible directions to invest in.",
        weights: { "CAUTIOUS-EXPLORER": 3 },
      },
      {
        label:
          "Me — my time and my judgement. There isn't a next hire I can make.",
        weights: { "CEILING-BREAKER": 3 },
      },
      {
        label: "Me — I'm doing everything from sales to delivery to admin.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label:
          "Handoffs between systems I already built. Data doesn't flow cleanly.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
  {
    sort_order: 6,
    prompt: "If I gave you 4 hours of free strategist time, you'd use it on…",
    choices: [
      {
        label: "Mapping out where AI could actually help my specific business.",
        weights: { "CAUTIOUS-EXPLORER": 3 },
      },
      {
        label:
          "Designing what a leveraged version of me looks like at 2× throughput.",
        weights: { "CEILING-BREAKER": 3 },
      },
      {
        label: "Untangling my current mess — what to keep, cut, or delegate.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label: "Architecting the system that ties my scattered tools together.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
  {
    sort_order: 7,
    prompt: "The number of software tools/subscriptions in your business is…",
    choices: [
      {
        label:
          "Under 10 — I'm cautious about adding more before I know they'll stick.",
        weights: { "CAUTIOUS-EXPLORER": 3 },
      },
      {
        label:
          "10-20 — I've tried a lot, kept the ones that pay for themselves.",
        weights: { "CEILING-BREAKER": 2, "SYSTEMS-ARCHITECT": 1 },
      },
      {
        label:
          "20+ but honestly I'm not sure — I signed up for things I forgot about.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label:
          "20+ and I've integrated several with Zapier/Make/custom scripts.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
  {
    sort_order: 8,
    prompt: "In 12 months, if nothing changes, you'll be…",
    choices: [
      {
        label: "Still on the sidelines watching others move faster with AI.",
        weights: { "CAUTIOUS-EXPLORER": 3 },
      },
      {
        label:
          "Exactly where I am today — capped, resenting the ceiling I built.",
        weights: { "CEILING-BREAKER": 3 },
      },
      {
        label: "Burned out. This pace is not sustainable and I know it.",
        weights: { "CHAOS-OPERATOR": 3 },
      },
      {
        label:
          "Frustrated by the same integration gaps — building islands, not the archipelago.",
        weights: { "SYSTEMS-ARCHITECT": 3 },
      },
    ],
  },
];

async function main() {
  console.log("Seeding quiz: %s", QUIZ_SLUG);

  // 1. Upsert quiz row.
  const { data: quiz, error: qErr } = await supabaseAdmin
    .from("quizzes")
    .upsert(
      {
        slug: QUIZ_SLUG,
        title: "What kind of solopreneur are you?",
        subtitle:
          "8 questions. 90 seconds. Find out which of the four solopreneur archetypes fits how you actually work today.",
        intro_md:
          "There are four kinds of solopreneurs who benefit from AI — each stuck for a different reason. This quiz identifies which one you are so we don't waste your time on generic advice.",
        cta_label: "Start quiz",
        published: true,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (qErr || !quiz) throw qErr ?? new Error("upsert quiz failed");
  console.log("  quiz id: %s", quiz.id);

  // 2. Upsert archetypes.
  for (const a of ARCHETYPES) {
    const { error } = await supabaseAdmin.from("quiz_archetypes").upsert(
      {
        quiz_id: quiz.id,
        key: a.key,
        name: a.name,
        sort_order: a.sort_order,
        one_line: a.one_line,
        full_report_md: a.full_report_md,
        ebook_label: "Click here to access the playbook",
      },
      { onConflict: "quiz_id,key" },
    );
    if (error) throw error;
    console.log("  archetype: %s", a.key);
  }

  // 3. Wipe & re-seed questions + choices (idempotent via cascade delete).
  // We wipe rather than upsert because choice ids change and we want the
  // sort_order↔prompt mapping to be authoritative.
  const { data: existingQs } = await supabaseAdmin
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quiz.id);
  if (existingQs && existingQs.length > 0) {
    await supabaseAdmin
      .from("quiz_questions")
      .delete()
      .in(
        "id",
        existingQs.map((r) => r.id),
      );
    console.log("  wiped %d existing questions", existingQs.length);
  }

  for (const q of QUESTIONS) {
    const { data: question, error: qqErr } = await supabaseAdmin
      .from("quiz_questions")
      .insert({
        quiz_id: quiz.id,
        sort_order: q.sort_order,
        prompt: q.prompt,
      })
      .select()
      .single();
    if (qqErr || !question) throw qqErr ?? new Error("insert question failed");
    console.log("  Q%d: %s", q.sort_order, q.prompt.slice(0, 60));

    for (let i = 0; i < q.choices.length; i++) {
      const c = q.choices[i];
      const { error: cErr } = await supabaseAdmin.from("quiz_choices").insert({
        question_id: question.id,
        sort_order: i + 1,
        label: c.label,
        archetype_weights: c.weights,
      });
      if (cErr) throw cErr;
    }
  }

  console.log("\nDone. Quiz live at /quiz/%s", QUIZ_SLUG);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
