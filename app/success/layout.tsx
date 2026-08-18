import { ClerkProvider } from "@clerk/nextjs";

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
