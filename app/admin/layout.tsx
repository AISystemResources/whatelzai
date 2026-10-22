import { isOwnerUser } from "@/lib/admin-policy";
import { notFound } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureUserRow();
  if (!user || !isOwnerUser(user)) notFound();

  return (
    <>
      <div className="min-h-dvh bg-white">
        <AdminNavigation />
        <main id="admin-main" className="min-w-0 overflow-x-hidden bg-white">
          <div className="mx-auto max-w-5xl px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 md:px-10 md:pt-10">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
