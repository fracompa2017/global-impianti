"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DipendenteOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Assegnazione {
  id: string;
  ruolo_cantiere: string | null;
  data_inizio: string | null;
  data_fine: string | null;
  dipendente_id: string | null;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
}

export function AssegnazioniTab({
  cantiereId,
  available,
  initial,
}: {
  cantiereId: string;
  available: DipendenteOption[];
  initial: Assegnazione[];
}) {
  const [assegnazioni, setAssegnazioni] = useState(initial);
  const [dipendenteId, setDipendenteId] = useState(available[0]?.id ?? "");
  const [ruolo, setRuolo] = useState("");

  const add = async () => {
    if (!dipendenteId) return;

    const response = await fetch(`/api/team/create?resource=assegnazione-add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cantiereId,
        dipendenteId,
        ruoloCantiere: ruolo,
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    setAssegnazioni((prev) => [data.assegnazione, ...prev]);
    setRuolo("");
  };

  const remove = async (id: string) => {
    setAssegnazioni((prev) => prev.filter((item) => item.id !== id));

    await fetch(`/api/team/create?resource=assegnazione-remove&id=${id}`, {
      method: "POST",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]">
        <select
          className="h-10 rounded-md border px-3 text-sm"
          value={dipendenteId}
          onChange={(event) => setDipendenteId(event.target.value)}
        >
          {available.map((dip) => (
            <option key={dip.id} value={dip.id}>
              {dip.full_name ?? dip.email ?? dip.id}
            </option>
          ))}
        </select>
        <Input
          placeholder="Ruolo nel cantiere"
          value={ruolo}
          onChange={(event) => setRuolo(event.target.value)}
        />
        <Button onClick={add}>Aggiungi</Button>
      </div>

      <div className="space-y-2">
        {assegnazioni.map((ass) => (
          <div key={ass.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{ass.profiles?.full_name ?? ass.profiles?.email ?? "N/D"}</p>
              <p className="text-xs text-muted-foreground">Ruolo: {ass.ruolo_cantiere ?? "N/D"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => remove(ass.id)}>
              Rimuovi
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
