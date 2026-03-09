"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isBefore,
  isSameDay,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TurnoMese = {
  id: string;
  data: string;
  ora_inizio: string | null;
  ora_fine: string | null;
  note: string | null;
  cantiere: {
    nome: string;
    indirizzo: string | null;
  } | null;
};

const weekLabels = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];

export function CalendarioTurni() {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [turni, setTurni] = useState<TurnoMese[]>([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [selected, setSelected] = useState<TurnoMese | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTurni() {
      setLoading(true);
      setErrore(null);

      try {
        const mese = getMonth(monthCursor) + 1;
        const anno = getYear(monthCursor);

        const response = await fetch(`/api/dipendente/turni/mese?mese=${mese}&anno=${anno}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Impossibile caricare i turni del mese");
        }

        const payload = (await response.json()) as { turni: TurnoMese[] };

        if (!mounted) return;
        setTurni(payload.turni ?? []);
      } catch (error) {
        if (!mounted) return;
        setErrore(error instanceof Error ? error.message : "Errore imprevisto");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTurni();

    return () => {
      mounted = false;
    };
  }, [monthCursor]);

  const turnoByDate = useMemo(() => {
    return new Map(turni.map((turno) => [turno.data, turno]));
  }, [turni]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1, locale: it });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1, locale: it });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const monthTitle = format(monthCursor, "MMMM yyyy", { locale: it });
  const monthTitleCapitalized = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);
  const today = new Date();

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">I miei turni</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="icon"
            size="icon"
            onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
            aria-label="Mese precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[140px] text-center text-base font-bold text-[#0A0C14] md:min-w-[180px] md:text-lg">
            {monthTitleCapitalized}
          </p>
          <Button
            type="button"
            variant="icon"
            size="icon"
            onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
            aria-label="Mese successivo"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="rounded-[20px] border-[1.5px] border-[#E8EAF0] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:p-5">
        <div className="grid grid-cols-7 gap-2 pb-2">
          {weekLabels.map((day) => (
            <p
              key={day}
              className="pb-1 text-center text-[0.75rem] font-bold tracking-[0.08em] text-[#9199B1]"
            >
              {day}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const turno = turnoByDate.get(iso) ?? null;
            const dayNumber = format(day, "d");
            const inCurrentMonth = getMonth(day) === getMonth(monthCursor);
            const hasCantiere = !!turno?.cantiere?.nome;
            const isToday = isSameDay(day, today);
            const isPast = isBefore(day, startOfDay(today));
            const weekendNoShift = !turno && isWeekend(day);

            return (
              <button
                type="button"
                key={iso}
                onClick={() => {
                  if (turno && inCurrentMonth) {
                    setSelected(turno);
                  }
                }}
                className={cn(
                  "min-h-16 rounded-xl border-[1.5px] p-2 text-left transition-all duration-150 md:min-h-20",
                  !inCurrentMonth && "cursor-default border-transparent bg-transparent",
                  inCurrentMonth && !turno && !weekendNoShift && "border-[#F0F2F7] bg-white",
                  inCurrentMonth && weekendNoShift && "border-[#F0F2F7] bg-[#FAFAFA]",
                  inCurrentMonth && turno && hasCantiere && "border-[#3B6FE8] bg-[linear-gradient(145deg,#EEF3FF,#E8F0FF)]",
                  inCurrentMonth && turno && !hasCantiere && "border-[#E8EAF0] border-dashed bg-[linear-gradient(145deg,#F8F9FC,#F2F4F8)]",
                  isToday && inCurrentMonth && "border-[#2D5ED4]",
                  isPast && inCurrentMonth && "pointer-events-none opacity-50",
                  turno && inCurrentMonth ? "cursor-pointer" : "cursor-default"
                )}
                disabled={!inCurrentMonth || !turno || isPast}
              >
                <div
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs",
                    !inCurrentMonth && "text-[#C5C9D6]",
                    inCurrentMonth && !turno && !weekendNoShift && "text-[#9199B1]",
                    inCurrentMonth && weekendNoShift && "text-[#C5C9D6]",
                    inCurrentMonth && turno && hasCantiere && "font-bold text-[#3B6FE8]",
                    inCurrentMonth && turno && !hasCantiere && "font-semibold text-[#4A5068]",
                    isToday && inCurrentMonth && "bg-[#3B6FE8] font-extrabold text-white"
                  )}
                >
                  {dayNumber}
                </div>

                {!inCurrentMonth ? null : turno ? (
                  hasCantiere ? (
                    <p className="mt-1 truncate rounded-lg bg-[#3B6FE8] px-2 py-1 text-[0.6875rem] font-semibold text-white md:text-xs">
                      {turno.cantiere?.nome}
                    </p>
                  ) : (
                    <span className="mt-1 inline-flex rounded-full border border-[#E8EAF0] bg-[#F2F4F8] px-2 py-0.5 text-[0.625rem] font-semibold text-[#9199B1]">
                      Cantiere da assegnare
                    </span>
                  )
                ) : null}
              </button>
            );
          })}
        </div>

        {loading ? <p className="mt-3 text-sm text-[#9199B1]">Caricamento turni...</p> : null}
        {errore ? <p className="mt-3 text-sm text-[#DC2626]">{errore}</p> : null}
      </section>

      <section className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#4A5068]">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#DCE8FF] bg-[#EEF3FF] px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-[#3B6FE8]" />
          Turno con cantiere
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#E8EAF0] bg-[#F8F9FC] px-3 py-1">
          <span className="h-2 w-2 rounded-full border border-dashed border-[#9199B1]" />
          Turno da completare
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#F0F2F7] bg-white px-3 py-1 text-[#9199B1]">
          <span className="h-2 w-2 rounded-full bg-[#D8DCE8]" />
          Giorno libero
        </span>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-0 md:items-center md:justify-center md:p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Chiudi"
            onClick={() => setSelected(null)}
          />

          <div className="relative z-10 w-full rounded-t-[24px] bg-white p-6 md:max-w-md md:rounded-2xl">
            <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-[#D8DCE8] md:hidden" />

            <div className="flex items-start justify-between gap-3">
              <p className="text-xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">
                {format(parseISO(selected.data), "EEEE d MMMM", { locale: it })
                  .replace(/^./, (char) => char.toUpperCase())}
              </p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-[#9199B1] transition-colors hover:bg-[#F2F4F8] hover:text-[#0A0C14]"
                aria-label="Chiudi dettagli"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected.cantiere ? (
              <div className="mt-4 rounded-2xl border-[1.5px] border-[#3B6FE8] bg-[linear-gradient(135deg,#EEF3FF,#E8F0FF)] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0A0C14]">
                  <MapPin className="h-4 w-4 text-[#3B6FE8]" />
                  {selected.cantiere.nome}
                </div>
                <p className="mt-1 text-sm text-[#4A5068]">
                  {selected.cantiere.indirizzo ?? "Indirizzo non disponibile"}
                </p>
                {(selected.ora_inizio || selected.ora_fine) ? (
                  <p className="mt-2 text-xs font-semibold text-[#3B6FE8]">
                    {selected.ora_inizio ?? "--:--"} - {selected.ora_fine ?? "--:--"}
                  </p>
                ) : null}
                {selected.note ? <p className="mt-2 text-sm text-[#4A5068]">{selected.note}</p> : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[#E8EAF0] p-4 text-center">
                <p className="text-2xl">🏗️</p>
                <p className="mt-2 text-sm font-semibold text-[#4A5068]">Cantiere non ancora assegnato</p>
                <p className="mt-1 text-xs text-[#9199B1]">Il tuo responsabile ti aggiornera a breve</p>
              </div>
            )}

            <div className="mt-5 flex justify-center">
              <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
