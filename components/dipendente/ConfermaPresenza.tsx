"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TipoGiornata = "intera" | "mezza";

type PresenzaOggi = {
  id: string;
  data: string;
  tipo_giornata: TipoGiornata | null;
  created_at: string;
};

function formatDateLabel(date: Date) {
  const raw = format(date, "EEEE, d MMMM yyyy", { locale: it });
  return raw
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function ConfermaPresenza() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [tipoGiornata, setTipoGiornata] = useState<TipoGiornata>("intera");
  const [presenza, setPresenza] = useState<PresenzaOggi | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/dipendente/presenza/oggi", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Errore caricamento presenza");
        }

        const payload = (await response.json()) as { presenza: PresenzaOggi | null };

        if (!mounted) return;

        setPresenza(payload.presenza);
        if (payload.presenza?.tipo_giornata) {
          setTipoGiornata(payload.presenza.tipo_giornata);
        }
      } catch (error) {
        if (!mounted) return;
        setErrore(error instanceof Error ? error.message : "Errore imprevisto");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const confermaLabel = useMemo(() => {
    if (!presenza?.created_at) return null;
    return format(new Date(presenza.created_at), "HH:mm");
  }, [presenza]);

  const submit = async () => {
    if (!tipoGiornata || saving || presenza) {
      return;
    }

    setErrore(null);
    setSaving(true);

    try {
      const response = await fetch("/api/dipendente/presenza", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo_giornata: tipoGiornata }),
      });

      const payload = (await response.json()) as {
        presenza?: PresenzaOggi;
        existing?: PresenzaOggi;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 409 && payload.existing) {
          setPresenza(payload.existing);
          setTipoGiornata(payload.existing.tipo_giornata ?? "intera");
          return;
        }

        throw new Error(payload.error ?? "Impossibile confermare la presenza");
      }

      if (payload.presenza) {
        setPresenza(payload.presenza);
        setTipoGiornata(payload.presenza.tipo_giornata ?? "intera");
      }
    } catch (error) {
      setErrore(error instanceof Error ? error.message : "Errore imprevisto");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-[20px] border-[1.5px] border-[#E8EAF0] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-[#9199B1]">Caricamento presenza di oggi...</p>
      </section>
    );
  }

  if (presenza) {
    const isMezza = (presenza.tipo_giornata ?? "intera") === "mezza";

    return (
      <section className="rounded-[20px] border-[1.5px] border-[#E8EAF0] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981] text-white"
          >
            <Check className="h-7 w-7" />
          </motion.span>

          <p className="mt-3 text-[1.125rem] font-bold text-[#10B981]">Presenza confermata</p>

          <span
            className={cn(
              "mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
              isMezza
                ? "border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]"
                : "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]"
            )}
          >
            ● {isMezza ? "Mezza Giornata" : "Giornata Intera"}
          </span>

          <p className="mt-2 text-[0.8125rem] text-[#9199B1]">
            Confermato oggi alle {confermaLabel ?? "--:--"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] border-[1.5px] border-[#E8EAF0] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <p className="text-[1.125rem] font-bold text-[#0A0C14]">Conferma la tua presenza di oggi</p>
      <p className="mt-1 text-sm text-[#9199B1]">{formatDateLabel(new Date())}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTipoGiornata("intera")}
          className={cn(
            "flex-1 rounded-xl border-[1.5px] px-4 py-3 text-[0.9375rem] font-semibold transition-all duration-200",
            tipoGiornata === "intera"
              ? "border-[#3B6FE8] bg-[linear-gradient(135deg,#EEF3FF,#E0EBFF)] text-[#3B6FE8] shadow-[0_2px_8px_rgba(59,111,232,0.15)]"
              : "border-[#E8EAF0] bg-[#F2F4F8] text-[#4A5068]"
          )}
          aria-pressed={tipoGiornata === "intera"}
        >
          Giornata Intera
        </button>

        <button
          type="button"
          onClick={() => setTipoGiornata("mezza")}
          className={cn(
            "flex-1 rounded-xl border-[1.5px] px-4 py-3 text-[0.9375rem] font-semibold transition-all duration-200",
            tipoGiornata === "mezza"
              ? "border-[#F97316] bg-[linear-gradient(135deg,#FFF7ED,#FFEDD5)] text-[#F97316] shadow-[0_2px_8px_rgba(249,115,22,0.15)]"
              : "border-[#E8EAF0] bg-[#F2F4F8] text-[#4A5068]"
          )}
          aria-pressed={tipoGiornata === "mezza"}
        >
          Mezza Giornata
        </button>
      </div>

      <Button className="mt-4 w-full" onClick={submit} disabled={!tipoGiornata || saving}>
        <Check className="mr-2 h-4 w-4" />
        {saving ? "Conferma in corso..." : "Conferma Presenza"}
      </Button>

      {errore ? <p className="mt-3 text-sm text-[#DC2626]">{errore}</p> : null}
    </section>
  );
}
