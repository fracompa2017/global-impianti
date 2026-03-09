"use client";

import { useEffect, useState } from "react";
import { Activity, ClipboardList, Construction, Timer } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
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
  const transformed = useTransform(motionValue, (latest) => latest.toFixed(decimals));
  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsubscribe = transformed.on("change", (latest) => setDisplay(latest));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [decimals, motionValue, transformed, value]);

  return (
    <motion.span variants={countUpVariants} className="kpi-count">
      {display}
    </motion.span>
  );
}

export function KpiCards({ kpi }: Props) {
  const cards = [
    {
      label: "Cantieri attivi",
      value: kpi.cantieriAttivi,
      icon: Construction,
      iconClass: "blue",
    },
    {
      label: "Dipendenti presenti oggi",
      value: kpi.dipendentiPresentiOggi,
      icon: Activity,
      iconClass: "green",
    },
    {
      label: "Report ricevuti oggi",
      value: kpi.reportRicevutiOggi,
      icon: ClipboardList,
      iconClass: "orange",
    },
    {
      label: "Ore totali mese",
      value: kpi.oreTotaliMese,
      icon: Timer,
      iconClass: "red",
      decimals: 1,
    },
  ];

  return (
    <motion.section
      variants={cardContainerVariants}
      initial="initial"
      animate="animate"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <motion.div key={card.label} variants={cardVariants}>
            <Card className="card-metric">
              <CardContent className="p-5">
                <div className="mb-5 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#4A5068]">{card.label}</p>
                    <p className="mt-1 text-xs text-[#9199B1]">Aggiornato ora</p>
                  </div>
                  <span className={`metric-icon ${card.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <div>
                  <AnimatedNumber value={card.value} decimals={card.decimals ?? 0} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
