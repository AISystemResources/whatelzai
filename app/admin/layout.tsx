import { ClerkProvider } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { ensureUserRow, isAdminRole } from "@/lib/users";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureUserRow();
  if (!user || !isAdminRole(user.role)) notFound();

  return (
    <ClerkProvider>
      <div className="flex min-h-screen bg-zinc-50">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden bg-white">
          <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10 sm:py-10">
            {children}
          </div>
        </main>
      </div>
    </ClerkProvider>
  );
}
