import { ClerkProvider } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { ensureUserRow, isAdminRole } from "@/lib/users";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureUserRow();
  if (!user || !isAdminRole(user.role)) notFound();

  return (
    <ClerkProvider>
      <div className="mx-auto max-w-5xl px-6 py-6">{children}</div>
    </ClerkProvider>
  );
}
