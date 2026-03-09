import { format } from "date-fns";

import { ClockReportPanel } from "@/components/dipendente/clock-report-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile, getDipendenteHomeData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DipendenteHomePage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  if (!profile) {
    return null;
  }

  const [data, { data: cantieriRows }] = await Promise.all([
    getDipendenteHomeData(profile.id),
    supabase
      .from("cantiere_assegnazioni")
      .select("cantiere_id, cantieri(id, nome)")
      .eq("dipendente_id", profile.id),
  ]);

  const cantieri = (cantieriRows ?? [])
    .map((row: any) => row.cantieri)
    .filter(Boolean)
    .map((c: any) => ({ id: c.id, nome: c.nome }));

  const interventiOggi = (data.turni ?? []).filter((turno: any) => turno.data === format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">Home Operativa</h1>
        <p className="text-sm text-[#4A5068]">
          {format(new Date(), "dd/MM/yyyy")} · Stato report oggi:{" "}
          <Badge variant={data.reportInviatoOggi ? "success" : "outline"}>
            {data.reportInviatoOggi ? "Inviato" : "Non inviato"}
          </Badge>
        </p>
      </header>

      <ClockReportPanel userId={profile.id} cantieri={cantieri} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interventi di oggi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {interventiOggi.length === 0 ? (
              <p className="text-sm text-[#4A5068]">Nessun intervento previsto oggi</p>
            ) : (
              interventiOggi.map((turno: any, idx: number) => {
                const urgent = (turno.note ?? "").toLowerCase().includes("urgente");

                return (
                  <article key={turno.id} className="rounded-2xl border border-[#E8EAF0] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#0A0C14]">{turno.cantieri?.nome ?? "Intervento"}</p>
                      <Badge variant={urgent || idx === 0 ? "critical" : "medium"} className={urgent || idx === 0 ? "priority-critical-pulse" : ""}>
                        {urgent || idx === 0 ? "urgente" : "programmato"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#4A5068]">
                      {turno.data} · {turno.ora_inizio ?? "--"} - {turno.ora_fine ?? "--"}
                    </p>
                  </article>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documenti recenti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.documenti.length === 0 ? (
              <p className="text-sm text-[#4A5068]">Nessun documento disponibile</p>
            ) : (
              data.documenti.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-[#E8EAF0] bg-white p-3 transition-all hover:border-[#DCE8FF]"
                >
                  <p className="font-semibold text-[#0A0C14]">{doc.nome}</p>
                  <p className="text-xs text-[#4A5068]">
                    {doc.tipo} · {doc.mese ?? ""}/{doc.anno ?? ""}
                  </p>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
