"use client";

import { SignUp, useUser } from "@clerk/nextjs";

export function SignUpBlock({
  prefilledEmail,
}: {
  prefilledEmail: string | null;
}) {
  const { isSignedIn, user } = useUser();

  if (isSignedIn) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
        <p>
          You&apos;re signed in as{" "}
          <span className="font-medium">
            {user?.emailAddresses?.[0]?.emailAddress ?? user?.id}
          </span>
          . Your Playbook access will link automatically once the receipt email
          matches your account.
        </p>
        <p className="mt-3">
          <a href="/playbook/introduction" className="underline">
            Start reading →
          </a>
        </p>
      </div>
    );
  }

  return (
    <SignUp
      routing="hash"
      signInUrl="/sign-in"
      forceRedirectUrl="/playbook/introduction"
      initialValues={
        prefilledEmail ? { emailAddress: prefilledEmail } : undefined
      }
    />
  );
}
