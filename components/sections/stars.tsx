// Subtle 5-star visual cue for testimonials. Not a rating field on the model —
// a decorative signal that scanners associate the person with positive words.

const STAR_PATH =
  "M12 2.5l2.9 6.3 6.6.7-4.9 4.7 1.4 6.8L12 17.7l-6 3.3 1.4-6.8L2.5 9.5l6.6-.7L12 2.5z";

export function Stars({ size = 14 }: { size?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-hidden
      style={{ color: "var(--accent-text)" }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}
