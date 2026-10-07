import Link from "next/link";
export function SignUpBlock({
  prefilledEmail,
}: {
  prefilledEmail: string | null;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
      <p>
        Sign in with the Google account that uses{" "}
        {prefilledEmail ?? "your purchase email"} to link your purchase.
      </p>
      <Link
        className="mt-4 inline-block underline"
        href="/sign-in?redirect_url=/account"
      >
        Continue with Google →
      </Link>
    </div>
  );
}
