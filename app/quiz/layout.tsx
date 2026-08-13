import { ClerkProvider } from "@clerk/nextjs";

// Quiz is public (no admin-role gate), but the player uses Clerk client hooks
// (useUser, SignInButton) for the unlock CTA. ClerkProvider must wrap them.
// Scoped here (not root) per LRN-004.
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
