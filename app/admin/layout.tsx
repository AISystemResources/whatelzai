import { isOwnerUser } from "@/lib/admin-policy";
import { notFound } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureUserRow();
  if (!user || !isOwnerUser(user)) notFound();

  return (
    <>
      <div className="flex min-h-screen flex-col bg-zinc-50 md:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:px-10 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
