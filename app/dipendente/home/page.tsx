import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin } from "lucide-react";

import { ConfermaPresenza } from "@/components/dipendente/ConfermaPresenza";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DipendenteHomePage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  if (!profile) {
    return null;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const nextWindow = format(addDays(new Date(), 14), "yyyy-MM-dd");

  const [{ data: turnoOggi }, { data: turniFuturi }, { data: reportOggi }] = await Promise.all([
    supabase
      .from("turni")
      .select("id, data, cantiere_id, cantieri(nome, indirizzo)")
      .eq("dipendente_id", profile.id)
      .eq("data", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("turni")
      .select("id, data, cantiere_id, cantieri(nome)")
      .eq("dipendente_id", profile.id)
      .gte("data", today)
      .lte("data", nextWindow)
      .order("data", { ascending: true }),
    supabase
      .from("report_giornalieri")
      .select("id, created_at")
      .eq("dipendente_id", profile.id)
      .eq("data", today)
      .maybeSingle(),
  ]);

  const { count: fotoCount = 0 } = reportOggi
    ? await supabase
        .from("report_foto")
        .select("*", { count: "exact", head: true })
        .eq("report_id", reportOggi.id)
    : { count: 0 };

  const seenDates = new Set<string>();
  const prossimiTurni = (turniFuturi ?? [])
    .filter((turno) => {
      if (seenDates.has(turno.data)) {
        return false;
      }
      seenDates.add(turno.data);
      return true;
    })
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <section className="-mt-6 relative z-20">
        <ConfermaPresenza />
      </section>

      <Card className="border-[1.5px] border-[#E8EAF0] bg-white">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-[#0A0C14]">Cantiere di oggi</p>
          {turnoOggi?.cantiere_id ? (
            <div className="mt-2 rounded-2xl border border-[#E8EAF0] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0A0C14]">
                <MapPin className="h-4 w-4 text-[#3B6FE8]" />
                {(turnoOggi.cantieri as any)?.nome ?? "Cantiere"}
              </div>
              <p className="mt-1 text-sm text-[#4A5068]">
                {(turnoOggi.cantieri as any)?.indirizzo ?? "Indirizzo non disponibile"}
              </p>
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border-2 border-dashed border-[#E8EAF0] bg-[#F8F9FC] p-5 text-center">
              <p className="text-sm font-semibold text-[#9199B1]">
                Nessun cantiere assegnato per oggi
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {reportOggi ? (
        <Card className="border-[1.5px] border-[#A7F3D0] bg-[linear-gradient(135deg,#ECFDF5,#F0FDF4)]">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-[#059669]">✅ Report inviato</p>
            <p className="mt-1 text-sm text-[#4A5068]">
              Inviato alle {format(new Date(reportOggi.created_at), "HH:mm")} · {fotoCount} foto allegate
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[1.5px] border-[#FDE68A] bg-[linear-gradient(135deg,#FFFBEB,#FFF7ED)]">
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-semibold text-[#B45309]">⚠️ Report di oggi da inviare</p>
            </div>
            <Button
              asChild
              className="border-transparent bg-[linear-gradient(135deg,#FB923C_0%,#F97316_100%)] shadow-[0_12px_28px_rgba(249,115,22,0.25)] after:bg-[linear-gradient(135deg,#FB923C_0%,#F97316_100%)]"
            >
              <Link href="/dipendente/report/nuovo">Compila ora →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#0A0C14]">Prossimi turni</p>
            <Link href="/dipendente/turni" className="text-sm font-semibold text-[#3B6FE8]">
              Vedi tutto →
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {prossimiTurni.length === 0 ? (
              <p className="text-sm text-[#9199B1]">Nessun turno pianificato nei prossimi giorni</p>
            ) : (
              prossimiTurni.map((turno: any) => {
                const raw = format(parseISO(turno.data), "EEE d", { locale: it });
                const dateLabel = raw.charAt(0).toUpperCase() + raw.slice(1);

                return (
                  <article
                    key={turno.id}
                    className="min-w-[120px] rounded-2xl border-[1.5px] border-[#E8EAF0] bg-white px-4 py-3"
                  >
                    <p className="text-xs font-bold text-[#0A0C14]">{dateLabel}</p>
                    <p className="mt-1 truncate text-xs text-[#9199B1]">
                      {(turno.cantieri as any)?.nome ?? "Da assegnare"}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
