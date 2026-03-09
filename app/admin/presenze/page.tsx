import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type SearchParams = {
  mese?: string;
  anno?: string;
};

type PresenzaRow = {
  dipendente_id: string | null;
  data: string;
  tipo_giornata: "intera" | "mezza" | null;
  created_at: string;
};

function getMonthDate(searchParams: SearchParams) {
  const now = new Date();
  const parsedMonth = Number(searchParams.mese);
  const parsedYear = Number(searchParams.anno);

  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth
    : now.getMonth() + 1;

  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
    ? parsedYear
    : now.getFullYear();

  return new Date(year, month - 1, 1);
}

export default async function AdminPresenzePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const monthDate = getMonthDate(searchParams);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const prevMonth = addMonths(monthDate, -1);
  const nextMonth = addMonths(monthDate, 1);

  const monthLabelRaw = format(monthDate, "MMMM yyyy", { locale: it });
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);

  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const supabase = await createClient();

  const { data: dipendenti } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "dipendente")
    .order("full_name", { ascending: true });

  const dipendenteIds = (dipendenti ?? []).map((dipendente) => dipendente.id);

  const { data: presenze } = dipendenteIds.length
    ? await supabase
        .from("timbrature")
        .select("dipendente_id, data, tipo_giornata, created_at")
        .in("dipendente_id", dipendenteIds)
        .gte("data", format(monthStart, "yyyy-MM-dd"))
        .lte("data", format(monthEnd, "yyyy-MM-dd"))
    : { data: [] as PresenzaRow[] };

  const presenzeRows = (presenze ?? []) as PresenzaRow[];

  const presenceMap = new Map<string, PresenzaRow>();
  presenzeRows.forEach((row) => {
    const key = `${row.dipendente_id}-${row.data}`;
    presenceMap.set(key, row);
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-[#0A0C14]">Presenze</h1>
          <p className="text-sm text-[#4A5068]">Conferme presenza giornaliere del team</p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="icon" size="icon" aria-label="Mese precedente">
            <Link href={`/admin/presenze?mese=${prevMonth.getMonth() + 1}&anno=${prevMonth.getFullYear()}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <p className="min-w-[150px] text-center text-lg font-bold text-[#0A0C14]">{monthLabel}</p>
          <Button asChild variant="icon" size="icon" aria-label="Mese successivo">
            <Link href={`/admin/presenze?mese=${nextMonth.getMonth() + 1}&anno=${nextMonth.getFullYear()}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {(dipendenti ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-[#4A5068]">Nessun dipendente disponibile.</CardContent>
        </Card>
      ) : (
        (dipendenti ?? []).map((dipendente) => {
          const rows = presenzeRows.filter((row) => row.dipendente_id === dipendente.id);
          const mezze = rows.filter((row) => row.tipo_giornata === "mezza").length;
          const intere = rows.filter((row) => (row.tipo_giornata ?? "intera") === "intera").length;
          const equivalente = intere + mezze * 0.5;

          return (
            <Card key={dipendente.id} className="overflow-x-auto">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#0A0C14]">{dipendente.full_name ?? dipendente.email}</p>
                    <p className="text-xs text-[#9199B1]">{dipendente.email}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#4A5068]">
                    {intere} giorni · {mezze} mezze giornate · equivalente {equivalente.toFixed(1)} giorni
                  </p>
                </div>

                <div className="min-w-[760px]">
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${allDays.length}, minmax(22px, 1fr))` }}
                  >
                    {allDays.map((day) => (
                      <p
                        key={`label-${day.toISOString()}`}
                        className="text-center text-[10px] font-semibold text-[#9199B1]"
                      >
                        {format(day, "d")}
                      </p>
                    ))}
                  </div>

                  <div
                    className="mt-2 grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${allDays.length}, minmax(22px, 1fr))` }}
                  >
                    {allDays.map((day) => {
                      const dayKey = format(day, "yyyy-MM-dd");
                      const row = presenceMap.get(`${dipendente.id}-${dayKey}`);

                      const isMezza = row?.tipo_giornata === "mezza";
                      const isIntera = !!row && !isMezza;
                      const time = row ? format(parseISO(row.created_at), "HH:mm") : null;

                      const title = row
                        ? isMezza
                          ? `Mezza giornata — confermata alle ${time}`
                          : `Giornata intera — confermata alle ${time}`
                        : "Assente / Non confermato";

                      return (
                        <span
                          key={`${dipendente.id}-${dayKey}`}
                          title={title}
                          className={`h-8 rounded-md border ${
                            isIntera
                              ? "border-[#059669] bg-[#10B981]"
                              : isMezza
                                ? "border-[#10B981] bg-[linear-gradient(90deg,#FFFFFF_50%,#10B981_50%)]"
                                : "border-[#E8EAF0] bg-[#F2F4F8]"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
