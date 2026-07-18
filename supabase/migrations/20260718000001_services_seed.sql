-- Seed initial 3 services: AI Training (from AI-TRAINING-OFFER-PRICING-STRATEGY EMDEE doc),
-- AI Mentor 1-1 (by-enquiry placeholder pricing), AI Digital Courses (coming_soon).

insert into services (
  slug, name, category, tagline, description, audience,
  pricing_model, pricing, deliverables, terms,
  cta_label, cta_url, proof, status, featured, published, sort_order
) values
(
  'ai-training',
  'AI Training',
  'training',
  'Practical AI workshops for teams — outcome, not slideware.',
  'Team-facing AI training built around a concrete artifact your team walks away with: a filled-in AI use-case map, or a one-page 30-day pilot plan. Per-session pricing (not per-head) so the price is stable regardless of who shows up. Content tailored to your stack and workflow, not generic prompt tips.',
  'Corporate / team L&D buyers',
  'per_session',
  jsonb_build_object(
    'currency', 'SGD',
    'tiers', jsonb_build_array(
      jsonb_build_object('id','half_day_list','label','Half-day (up to 15 pax)','amount',3000,'unit','session','note','4h content'),
      jsonb_build_object('id','full_day_list','label','Full-day (up to 15 pax)','amount',5000,'unit','session','note','7h content'),
      jsonb_build_object('id','addon_pax','label','Additional participant','amount',50,'unit','pax')
    ),
    'founding', jsonb_build_object(
      'expires_after_engagements', 3,
      'trade', 'a written testimonial + permission to publish an anonymised case study',
      'public', true,
      'tiers', jsonb_build_array(
        jsonb_build_object('id','half_day_founding','label','Half-day','amount',1800,'unit','session'),
        jsonb_build_object('id','full_day_founding','label','Full-day','amount',3000,'unit','session')
      )
    )
  ),
  array[
    'Content tailored to your team''s tools and workflow',
    'One takeaway artifact: AI use-case map OR 30-day pilot plan',
    'Hands-on exercises with your real (non-sensitive) data',
    'Prep + travel folded in (Singapore)',
    'Post-session write-up with next steps for each team member'
  ],
  jsonb_build_object(
    'deposit_pct', 50,
    'cap_pax', 15,
    'notes', jsonb_build_array('Prep + travel folded in', 'SkillsFuture / WSQ subsidy not yet available')
  ),
  'Book a session',
  'mailto:elz.work22@gmail.com?subject=AI%20Training%20enquiry',
  '2× AI Engineering intern @ Prudential (5,000+ Financial Advisors) — I train from what I''ve shipped, not what I''ve read.',
  'live',
  true,
  true,
  1
),
(
  'ai-mentor-1-1',
  'AI Mentor — 1-on-1',
  'mentor',
  'Long-arc mentorship for engineers building AI-native products.',
  'Recurring 1-on-1 sessions for builders who want a senior sounding board — architecture reviews, code-level feedback, career navigation, and getting unstuck on the hard parts. Booked in packs so we can actually build momentum, not one-off chats.',
  'Engineers, founders, students building AI products',
  'package',
  jsonb_build_object(
    'currency', 'SGD',
    'tiers', jsonb_build_array(
      jsonb_build_object('id','single','label','Single session (60 min)','amount',null,'unit','session','note','Trial / one-off'),
      jsonb_build_object('id','pack_4','label','4-session pack','amount',null,'unit','pack','note','Monthly cadence recommended'),
      jsonb_build_object('id','pack_12','label','12-session pack','amount',null,'unit','pack','note','Quarterly commitment')
    )
  ),
  array[
    '60-minute video sessions, recorded if useful',
    'Async Slack / email between sessions for quick unblocks',
    'Architecture reviews of your actual codebase',
    'Career + positioning advice from someone shipping now',
    'No fixed curriculum — your questions drive it'
  ],
  jsonb_build_object(
    'notes', jsonb_build_array('Pricing finalising — email for current rate', 'Limited seats each month')
  ),
  'Enquire about mentorship',
  'mailto:elz.work22@gmail.com?subject=1-1%20Mentorship%20enquiry',
  'I mentor the same way I''d want to be mentored — direct, code-in-hand, no fluff.',
  'live',
  false,
  true,
  2
),
(
  'ai-digital-courses',
  'AI Digital Courses',
  'course',
  'Self-paced courses on shipping real AI systems.',
  'Async, video-based courses on the things I actually get asked about most: shipping production AI, building MCP servers, wiring Next.js + Supabase + Groq into working products. First course in production — join the waitlist to get early access and founding-member pricing.',
  'Self-directed engineers and builders',
  'per_seat',
  jsonb_build_object(
    'currency', 'SGD',
    'tiers', jsonb_build_array(
      jsonb_build_object('id','course_seat','label','Per-seat access','amount',null,'unit','seat','note','Waitlist open — founding pricing for early members')
    )
  ),
  array[
    'Video lessons, self-paced',
    'Working code repositories you can fork',
    'Companion notes + prompt libraries',
    'Founding-member discount for waitlist joiners',
    'Lifetime access to the first cohort'
  ],
  null,
  'Join the waitlist',
  'mailto:elz.work22@gmail.com?subject=AI%20Course%20waitlist',
  'Built by someone who ships — not someone who only writes about shipping.',
  'coming_soon',
  false,
  true,
  3
)
on conflict (slug) do nothing;
