"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Clock3, TimerReset, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cardContainerVariants, cardVariants } from "@/lib/animations";

export function ClockReportPanel({
  userId,
  cantieri,
}: {
  userId: string;
  cantieri: Array<{ id: string; nome: string }>;
}) {
  const hasCantieri = cantieri.length > 0;
  const [cantiereId, setCantiereId] = useState(cantieri[0]?.id ?? "");
  const [reportText, setReportText] = useState("");
  const [materiali, setMateriali] = useState("");
  const [problemi, setProblemi] = useState("");
  const [meteo, setMeteo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [workingSince, setWorkingSince] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const workedLabel = useMemo(() => {
    if (!workingSince) return null;
    const diffMin = Math.max(0, Math.floor((nowTs - workingSince) / 60000));
    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;
    return `${hours}h ${minutes}m`;
  }, [nowTs, workingSince]);

  const timbraEntrata = async () => {
    setMsg(null);
    const res = await fetch("/api/team/create?resource=timbratura-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cantiereId }),
    });

    if (res.ok) {
      setWorkingSince(Date.now());
      setMsg("Timbratura entrata registrata");
      return;
    }

    setMsg("Errore timbratura entrata");
  };

  const timbraUscita = async () => {
    setMsg(null);
    const res = await fetch("/api/team/create?resource=timbratura-exit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cantiereId }),
    });

    if (res.ok) {
      setWorkingSince(null);
      setMsg("Timbratura uscita registrata");
      return;
    }

    setMsg("Errore timbratura uscita");
  };

  const inviaReport = async () => {
    setMsg(null);
    const data = format(new Date(), "yyyy-MM-dd");

    const res = await fetch("/api/team/create?resource=report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        cantiereId,
        data,
        testo: reportText,
        materiali,
        problemi,
        meteo,
      }),
    });

    setMsg(res.ok ? "Report inviato" : "Errore invio report");
    if (res.ok) {
      setReportText("");
      setMateriali("");
      setProblemi("");
      setMeteo("");
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={cardContainerVariants}
      className="grid gap-4 lg:grid-cols-2"
    >
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Timbratura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasCantieri ? (
              <p className="text-sm text-[#4A5068]">Nessun cantiere assegnato. Contatta l'amministratore.</p>
            ) : null}

            <div className="space-y-1">
              <Label htmlFor="cantiere">Cantiere</Label>
              <select
                id="cantiere"
                className="h-11 w-full rounded-xl border-[1.5px] border-[#E8EAF0] bg-[#F8F9FC] px-4 text-sm text-[#0A0C14] outline-none transition-all focus:border-[#3B6FE8] focus:bg-white focus:ring-4 focus:ring-[rgba(59,111,232,0.1)]"
                value={cantiereId}
                onChange={(event) => setCantiereId(event.target.value)}
                disabled={!hasCantieri}
              >
                {cantieri.map((cantiere) => (
                  <option key={cantiere.id} value={cantiere.id}>
                    {cantiere.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-[#E8EAF0] bg-[#FBFCFF] p-5 text-center">
              <div className="relative mx-auto mb-4 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] text-white shadow-[0_14px_34px_rgba(59,111,232,0.35)]">
                {workingSince ? (
                  <Zap className="h-10 w-10" />
                ) : (
                  <Clock3 className="h-10 w-10" />
                )}
                {!workingSince ? (
                  <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#3B6FE8]/40 animate-ping" />
                ) : null}
              </div>

              {workingSince ? (
                <>
                  <p className="text-sm text-[#4A5068]">Stai lavorando da</p>
                  <p className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">{workedLabel}</p>
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="destructive"
                      className="mt-4 w-full"
                      onClick={timbraUscita}
                      disabled={!hasCantieri}
                    >
                      <TimerReset className="mr-2 h-4 w-4" />
                      TIMBRA USCITA
                    </Button>
                  </motion.div>
                </>
              ) : (
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button className="w-full" onClick={timbraEntrata} disabled={!hasCantieri}>
                    TIMBRA ENTRATA
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Report Giornaliero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="report">Attivita svolte</Label>
              <Textarea id="report" value={reportText} onChange={(event) => setReportText(event.target.value)} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="materiali">Materiali</Label>
                <Input id="materiali" value={materiali} onChange={(event) => setMateriali(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="meteo">Meteo</Label>
                <Input id="meteo" value={meteo} onChange={(event) => setMeteo(event.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="problemi">Problemi riscontrati</Label>
              <Textarea id="problemi" value={problemi} onChange={(event) => setProblemi(event.target.value)} />
            </div>

            <Button onClick={inviaReport} disabled={!hasCantieri}>
              Invia report
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {msg ? (
        <p className="lg:col-span-2 rounded-xl border border-[#E8EAF0] bg-white px-4 py-3 text-sm text-[#4A5068]">{msg}</p>
      ) : null}
    </motion.div>
  );
}
