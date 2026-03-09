"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TipoGiornata = "intera" | "mezza";

type Props = {
  presenzaOggi?: { tipo_giornata: TipoGiornata; created_at: string } | null;
};

export function ConfermaPresenza({ presenzaOggi: initialPresenza }: Props) {
  const [presenza, setPresenza] = useState(initialPresenza ?? null);
  const [tipo, setTipo] = useState<TipoGiornata>("intera");
  const [isPending, startTransition] = useTransition();

  const handleConferma = () => {
    startTransition(async () => {
      const res = await fetch("/api/dipendente/presenza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo_giornata: tipo }),
      });
      if (res.ok) {
        const data = await res.json();
        setPresenza(data);
      }
    });
  };

  if (presenza) {
    const isMezza = presenza.tipo_giornata === "mezza";
    const ora = new Date(presenza.created_at).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className="rounded-[24px] p-5"
        style={{
          background: "white",
          boxShadow: "0 4px 20px rgba(12,26,58,0.10), 0 1px 4px rgba(12,26,58,0.06)",
        }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px]"
            style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)" }}
          >
            <CheckCircle2 className="h-7 w-7 text-[#22C55E]" strokeWidth={2.2} />
          </motion.div>
          <div>
            <p className="text-base font-extrabold tracking-[-0.02em] text-[#0C1117]">
              Presenza confermata ✓
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={
                  isMezza
                    ? { background: "#FFF3E8", color: "#F97316" }
                    : { background: "#F0FDF4", color: "#22C55E" }
                }
              >
                {isMezza ? "Mezza giornata" : "Giornata intera"}
              </span>
              <span className="text-xs font-medium text-[#94A3B8]">Ore {ora}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="rounded-[24px] p-5"
      style={{
        background: "white",
        boxShadow: "0 4px 20px rgba(12,26,58,0.10), 0 1px 4px rgba(12,26,58,0.06)",
      }}
    >
      <p className="text-base font-extrabold tracking-[-0.02em] text-[#0C1117]">
        Conferma la tua presenza
      </p>
      <p className="mt-0.5 text-sm font-medium text-[#94A3B8]">
        {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {/* Toggle pills */}
      <div className="mt-4 flex gap-2.5">
        {(["intera", "mezza"] as TipoGiornata[]).map((t) => {
          const active = tipo === t;
          const isOrange = t === "mezza";
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "flex-1 rounded-[14px] py-3 text-sm font-bold transition-all duration-200",
                active
                  ? isOrange
                    ? "text-[#F97316]"
                    : "text-[#2B5CE6]"
                  : "text-[#94A3B8] hover:text-[#475569]"
              )}
              style={
                active
                  ? {
                      background: isOrange
                        ? "linear-gradient(135deg,#FFF3E8,#FFE4C8)"
                        : "linear-gradient(135deg,#EBF1FF,#DDE8FF)",
                      border: `1.5px solid ${isOrange ? "#FED7AA" : "#BFDBFE"}`,
                      boxShadow: isOrange
                        ? "0 2px 10px rgba(249,115,22,0.18)"
                        : "0 2px 10px rgba(43,92,230,0.18)",
                    }
                  : {
                      background: "#F4F1EC",
                      border: "1.5px solid #EAE6DF",
                    }
              }
            >
              {t === "intera" ? "Giornata Intera" : "Mezza Giornata"}
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleConferma}
        disabled={isPending}
        className="mt-4 w-full"
        variant={tipo === "mezza" ? "orange" : "default"}
        size="lg"
      >
        {isPending ? "Conferma in corso..." : "Conferma Presenza ✓"}
      </Button>
    </div>
  );
}
