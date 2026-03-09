import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { ConfermaPresenza } from "@/components/dipendente/ConfermaPresenza";
import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DipendenteHomePage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();
  if (!profile) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const nextWindow = format(addDays(new Date(), 14), "yyyy-MM-dd");

  const [{ data: turnoOggi }, { data: turniFuturi }, { data: reportOggi }, { data: presenzaOggi }] =
    await Promise.all([
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
      supabase
        .from("timbrature")
        .select("id, tipo_giornata, created_at")
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
    .filter((t) => { if (seenDates.has(t.data)) return false; seenDates.add(t.data); return true; })
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Conferma Presenza — sovrapposta sull'header */}
      <section className="-mt-6 relative z-20">
        <ConfermaPresenza presenzaOggi={presenzaOggi as any} />
      </section>

      {/* Cantiere oggi */}
      <div className="rounded-[24px] p-5"
        style={{ background: "white", boxShadow: "0 2px 8px rgba(12,26,58,0.07)" }}>
        <p className="text-sm font-bold text-[#475569]">Cantiere di oggi</p>
        {turnoOggi?.cantiere_id ? (
          <div className="mt-3 rounded-[16px] p-4"
            style={{ background: "linear-gradient(135deg,#EBF1FF,#E0EBFF)", border: "1.5px solid #BFDBFE" }}>
            <div className="flex items-center gap-2 font-bold text-[#0C1117]">
              <MapPin className="h-4 w-4 text-[#2B5CE6]" />
              {(turnoOggi.cantieri as any)?.nome ?? "Cantiere"}
            </div>
            <p className="mt-1 text-sm font-medium text-[#475569]">
              {(turnoOggi.cantieri as any)?.indirizzo ?? "Indirizzo non disponibile"}
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-[16px] p-5 text-center"
            style={{ background: "#F4F1EC", border: "2px dashed #DDD9D2" }}>
            <p className="text-sm font-bold text-[#94A3B8]">Nessun cantiere assegnato per oggi</p>
          </div>
        )}
      </div>

      {/* Report status */}
      {reportOggi ? (
        <div className="rounded-[24px] p-5"
          style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", boxShadow: "0 2px 8px rgba(34,197,94,0.10)" }}>
          <p className="font-bold text-[#15803D]">✅ Report inviato</p>
          <p className="mt-1 text-sm font-medium text-[#475569]">
            Inviato alle {format(new Date(reportOggi.created_at), "HH:mm")} · {fotoCount} foto allegate
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-[24px] p-5"
          style={{ background: "linear-gradient(135deg,#FFFBEB,#FFF3D4)", boxShadow: "0 2px 8px rgba(234,179,8,0.12)" }}>
          <div>
            <p className="font-bold text-[#92400E]">⚠️ Report di oggi da inviare</p>
            <p className="mt-0.5 text-xs font-medium text-[#A16207]">Ricorda di compilarlo prima di fine giornata</p>
          </div>
          <Button asChild variant="orange" size="sm">
            <Link href="/dipendente/report/nuovo">Compila →</Link>
          </Button>
        </div>
      )}

      {/* Prossimi turni */}
      <div className="rounded-[24px] p-5"
        style={{ background: "white", boxShadow: "0 2px 8px rgba(12,26,58,0.07)" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[#0C1117]">Prossimi turni</p>
          <Link href="/dipendente/turni" className="text-sm font-bold text-[#2B5CE6] hover:underline">
            Vedi tutto →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {prossimiTurni.length === 0 ? (
            <p className="text-sm font-medium text-[#94A3B8]">Nessun turno nei prossimi giorni</p>
          ) : (
            prossimiTurni.map((turno: any) => {
              const raw = format(parseISO(turno.data), "EEE d", { locale: it });
              const dateLabel = raw.charAt(0).toUpperCase() + raw.slice(1);
              const hasCantiere = !!(turno.cantieri as any)?.nome;

              return (
                <article key={turno.id} className="min-w-[130px] shrink-0 rounded-[18px] px-4 py-3"
                  style={
                    hasCantiere
                      ? { background: "linear-gradient(135deg,#EBF1FF,#E0EBFF)", border: "1.5px solid #BFDBFE" }
                      : { background: "#F4F1EC", border: "1.5px dashed #DDD9D2" }
                  }>
                  <p className="text-xs font-extrabold text-[#0C1117]">{dateLabel}</p>
                  <p className="mt-1 truncate text-xs font-semibold"
                    style={{ color: hasCantiere ? "#2B5CE6" : "#94A3B8" }}>
                    {(turno.cantieri as any)?.nome ?? "Da assegnare"}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
