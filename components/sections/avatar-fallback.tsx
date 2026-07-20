// Minimalist silhouette shown when a testimonial has no author_avatar_url.
// Sized via className on the wrapping div. Matches the aesthetic of a
// real avatar circle so cards without photos don't feel visually broken.
export function AvatarFallback({
  className,
  ariaLabel,
}: {
  className: string;
  ariaLabel: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-[55%] w-[55%]"
        aria-hidden
      >
        <path d="M12 2a5 5 0 100 10 5 5 0 000-10zm0 12c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
      </svg>
    </div>
  );
}
