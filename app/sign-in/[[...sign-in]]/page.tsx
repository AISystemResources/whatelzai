import { ClerkProvider, SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </main>
    </ClerkProvider>
  );
}
