import { redirect } from "next/navigation";

import { AdminShellClient } from "@/components/admin/admin-shell-client";
import { getCurrentUserProfile } from "@/lib/supabase/queries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/auth/login");
  }

  if (profile.role !== "admin") {
    redirect("/dipendente/home");
  }

  return <AdminShellClient>{children}</AdminShellClient>;
}
