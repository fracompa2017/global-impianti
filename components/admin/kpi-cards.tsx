"use client";

import { useEffect, useState } from "react";
import { Activity, ClipboardList, Construction, Timer } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { cardContainerVariants, cardVariants, countUpVariants } from "@/lib/animations";

type Props = {
  kpi: {
    cantieriAttivi: number;
    dipendentiPresentiOggi: number;
    reportRicevutiOggi: number;
    oreTotaliMese: number;
  };
};

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const motionValue = useMotionValue(0);
  const transformed = useTransform(motionValue, (v) => v.toFixed(decimals));
  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    const unsub = transformed.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [decimals, motionValue, transformed, value]);

  return <motion.span variants={countUpVariants} className="kpi-count">{display}</motion.span>;
}

const cards = (kpi: Props["kpi"]) => [
  {
    label: "Cantieri attivi",
    sub: "in corso oggi",
    value: kpi.cantieriAttivi,
    icon: Construction,
    iconClass: "blue",
    accent: "#2B5CE6",
    bgAccent: "#EBF1FF",
  },
  {
    label: "Presenti oggi",
    sub: "dipendenti confermati",
    value: kpi.dipendentiPresentiOggi,
    icon: Activity,
    iconClass: "green",
    accent: "#22C55E",
    bgAccent: "#F0FDF4",
  },
  {
    label: "Report ricevuti",
    sub: "inviati oggi",
    value: kpi.reportRicevutiOggi,
    icon: ClipboardList,
    iconClass: "orange",
    accent: "#F97316",
    bgAccent: "#FFF3E8",
  },
  {
    label: "Ore totali mese",
    sub: "giorni lavorati",
    value: kpi.oreTotaliMese,
    icon: Timer,
    iconClass: "red",
    accent: "#EF4444",
    bgAccent: "#FEF2F2",
    decimals: 1,
  },
];

export function KpiCards({ kpi }: Props) {
  return (
    <motion.section
      variants={cardContainerVariants}
      initial="initial"
      animate="animate"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {cards(kpi).map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={cardVariants}>
            <div
              className="relative overflow-hidden rounded-[24px] p-5 transition-all duration-200 hover:-translate-y-1"
              style={{
                background: "white",
                boxShadow: "0 2px 8px rgba(12,26,58,0.07), 0 1px 2px rgba(12,26,58,0.04)",
              }}
            >
              {/* Corner blob */}
              <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full"
                style={{ background: card.bgAccent, opacity: 0.6 }} />

              <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#475569]">{card.label}</p>
                    <p className="mt-0.5 text-xs text-[#94A3B8]">{card.sub}</p>
                  </div>
                  <div className={`metric-icon ${card.iconClass}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <AnimatedNumber value={card.value} decimals={card.decimals ?? 0} />
                  <div
                    className="mb-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                    style={{ background: card.bgAccent, color: card.accent }}
                  >
                    live
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
