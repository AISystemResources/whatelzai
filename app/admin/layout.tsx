import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const { data } = await supabaseAdmin
    .from("system_config")
    .select("value")
    .eq("key", "clerk_admin_user_id")
    .single();

  if (!userId || !data?.value || userId !== data.value) {
    notFound();
  }

  return (
    <ClerkProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </ClerkProvider>
  );
}
