import { format } from "date-fns";
import { redirect } from "next/navigation";

import { ReportGiornalieroForm } from "@/components/dipendente/report-giornaliero-form";
import { getCurrentUserProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DipendenteNuovoReportPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: turnoOggi } = await supabase
    .from("turni")
    .select("cantiere_id, cantieri(nome, indirizzo)")
    .eq("dipendente_id", profile.id)
    .eq("data", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cantiere = turnoOggi?.cantiere_id
    ? {
        id: turnoOggi.cantiere_id,
        nome: (turnoOggi.cantieri as any)?.nome ?? "Cantiere",
        indirizzo: (turnoOggi.cantieri as any)?.indirizzo ?? null,
      }
    : null;

  return (
    <ReportGiornalieroForm
      cantiereOggi={cantiere}
      dipendenteNome={profile.full_name ?? "Tecnico"}
    />
  );
}
