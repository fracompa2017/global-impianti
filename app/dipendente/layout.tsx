import { redirect } from "next/navigation";

import { DipendenteShellClient } from "@/components/dipendente/dipendente-shell-client";
import { getCurrentUserProfile } from "@/lib/supabase/queries";

export default async function DipendenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/auth/login");
  }

  if (profile.role !== "dipendente") {
    redirect("/admin/dashboard");
  }

  return (
    <DipendenteShellClient userName={profile.full_name ?? "Dipendente"}>
      {children}
    </DipendenteShellClient>
  );
}
