# Taste refinement audit

Source: https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md and redesign-skill/SKILL.md, read 2026-09-19.

Reading this as an editorial site for aspiring solopreneurs, preserving the tactile publication identity and the playbook-first journey. DESIGN_VARIANCE 6 / MOTION_INTENSITY 5 / VISUAL_DENSITY 3. Native CSS + existing Tailwind 4, Next.js and framer-motion; no new runtime dependencies.

## Before

- Paper #f6f3eb, ink #292e25, muted olive and ochre book cover. Fraunces + Geist + Geist Mono. Sharp controls, rounded book edges.
- Stable routes, playbook primary CTA, journey/newsletter secondary. Preserve reader gestures, form APIs, nav names, wordmark and metadata.
- Hero has eight competing text fragments, decorative orbit, two sticky notes and a repeated motto strip.
- Numbered eyebrows repeat across nearly every section; reading labels are often 8-10px.
- Identical article cards give every article equal weight. Multiple sections repeat an italic broken heading and split introduction.
- Footer repeats the preceding onward CTA. Active Explore destinations lack current-page feedback.
- Motion is mostly hover rotation with no pointer response or pillar transition.

## Targeted changes

Simplify hero, preserve interactive CSS book as a depiction of the existing reader rather than a fake product UI. Add spring pointer response with static touch/reduced-motion fallback. Give content the emphasis previously spent on labels and section counters. Use a featured article plus compact supporting list, a manually controlled real testimonial excerpt, and a generated conceptual learning still life. Refine body size, line length, reading measure and shared collection headers. Preserve real dates and quotes exactly; never fabricate proof or alter someone else's testimony for a stylistic ban.

## Contextual exceptions

Light-only remains the established project requirement and matches print-emulating editorial. Preserve Fraunces: it is already the book reader's display face and continuity with that product is intentional. Keep the existing warm brand palette and primary nav label “Field notes”. Do not globally rewrite published content, quotes, dates, routes or metadata to satisfy vocabulary bans. No decorative counters or new em-dashes in authored presentation copy. Existing product pagination numbers serve navigation and remain intact.

## Image provenance

Built-in image_gen, conceptual editorial artwork, not a photo of Edmund's actual desk or a physical product being sold. Prompt: “Editorial still life, landscape 3:2. Open unbranded ivory notebook, graphite pencil, olive and muted ochre cloth books on a pale warm desk. Soft natural light from upper left, detailed paper and cloth texture, restrained contemporary publication photography. No people, hands, screens, text, logos or labels.” Saved as public/images/editorial/learning-still-life.png.

## Validation

Verified 2026-09-19: production webpack build and TypeScript pass; targeted ESLint, formatted changed files and git diff whitespace checks pass; all seven existing pagination and gesture tests pass. Browser reviewed at 1280, 820, 390 and 320px widths. Confirmed pillar switching, testimonial controls, article navigation, responsive Explore menu, Escape dismissal, reader opening and keyboard page turning. No browser console errors during final reader check. Narrow-phone header CTA wrapping corrected. Final preview: http://localhost:3104/.

No Lighthouse score was collected: the enabled browser interface does not expose Lighthouse. No performance-score claim is made. The conceptual image uses Next Image with responsive sizes and lazy loading. No runtime dependency added. Touch gesture classification is covered by existing unit tests; physical touchscreen gestures and pointer tilt were not device-tested in this pass.
