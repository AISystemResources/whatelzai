# Playbook preview

The public `/playbook` reader uses a reviewed snapshot of the twelve EMDEE chapter drafts, imported on 2026-09-19. It does not query the private vault at runtime. `source-manifest.json` records each source path and content hash for the next import; only `chapters.json` is sent to the reader.

## Import boundary

Extract everything following the source's `## Chapter body` or `### Chapter body`, including subsequent chapter sections such as “Move this week”. Exclude the document preamble, relationships, status, editorial instructions, `EDMUND-PLACEHOLDER` blocks and `SCREENSHOT SLOT` blocks. Preserve the remaining chapter prose. Display titles are reader-friendly versions of the source filenames; the interface uses Edmund's current “Money Mindset” terminology. Source chapters retain their existing prose.

To refresh, retrieve the twelve exact sources from the manifest using authenticated EMDEE tooling, compare their hashes, review the chapter-body changes, and replace the corresponding `body` values. Update the manifest hashes/date together. Never export whole vault documents into the public content file. The draft includes claims and resource references still awaiting Edmund's editorial review; the UI explicitly labels the edition as a work in progress.

## Reader

CSS perspective and two-sided page leaves provide the 3D presentation without WebGL or extra dependencies. Desktop displays two pages; narrow screens display one. Paragraphs stay intact. Long pages can scroll independently so content is never clipped; reading mode exposes complete chapters as flowing text. Chapter navigation, arrow keys inside the reader, touch swipes and reduced motion are supported.

### Swipe navigation

In book mode, horizontal trackpad wheel gestures turn a page once per gesture. A 60px accumulated threshold filters accidental movements; the 220ms idle reset prevents momentum from skipping multiple pages. Vertical gestures and ctrl/meta wheel zoom are left to the browser. The wheel listener is scoped to the open book and uses `passive: false` to suppress browser history navigation only for horizontal gestures.

Touchscreens use a primary single-pointer swipe with a 55px threshold and horizontal axis dominance. Pointer capture preserves the gesture when the finger leaves the book; cancellation and secondary touches abandon it. Vertical panning and pinch zoom remain native. Validate with `node --import tsx --test scripts/playbook-gestures.test.ts`.

## Paid access later

This preview intentionally exposes all imported chapter bodies without sign-in or payment. `app/playbook/_components/storefront.tsx` retains the earlier sales page, while existing checkout, account, and protected `/playbook/[chapter]` routes remain intact. Add entitlement checks on the server **before** serializing paid content to the reader; a client-side overlay cannot protect these bodies. Do not put the paid corpus in `public/` or import it directly into a client component.

## Validation

`node --import tsx --test scripts/playbook-pagination.test.ts` verifies chapter completeness, ordering, and the content-export boundary. Run the repo build, typecheck and lint in addition to desktop/mobile reader checks.
