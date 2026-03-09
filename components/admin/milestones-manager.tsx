"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface MilestoneRow {
  id: string;
  titolo: string;
  descrizione: string | null;
  data_prevista: string | null;
  completata: boolean;
  percentuale_avanzamento: number;
  ordine: number;
}

export function MilestonesManager({
  cantiereId,
  initial,
}: {
  cantiereId: string;
  initial: MilestoneRow[];
}) {
  const [items, setItems] = useState(initial);
  const [titolo, setTitolo] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const progress = useMemo(() => {
    if (!items.length) {
      return 0;
    }

    const done = items.filter((item) => item.completata).length;
    return Math.round((done / items.length) * 100);
  }, [items]);

  const addMilestone = async () => {
    if (!titolo.trim()) {
      return;
    }

    const response = await fetch(`/api/team/create?resource=milestone&cantiereId=${cantiereId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titolo }),
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setItems((prev) => [...prev, data.milestone]);
    setTitolo("");
  };

  const toggleDone = async (id: string, value: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completata: value } : item))
    );

    await fetch(`/api/team/create?resource=milestone-toggle&id=${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completata: value }),
    });
  };

  const move = async (id: string, direction: "up" | "down") => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const newItems = [...items];
    [newItems[index], newItems[nextIndex]] = [newItems[nextIndex], newItems[index]];

    const normalized = newItems.map((item, idx) => ({ ...item, ordine: idx + 1 }));
    setItems(normalized);

    await fetch(`/api/team/create?resource=milestone-order&cantiereId=${cantiereId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: normalized.map((item) => ({ id: item.id, ordine: item.ordine })) }),
    });
  };

  const dropOn = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      return;
    }

    const sourceIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const ordered = [...items];
    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    const normalized = ordered.map((item, idx) => ({ ...item, ordine: idx + 1 }));
    setItems(normalized);
    setDraggedId(null);

    await fetch(`/api/team/create?resource=milestone-order&cantiereId=${cantiereId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: normalized.map((item) => ({ id: item.id, ordine: item.ordine })) }),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Progress value={progress} className="h-3" />
        <p className="mt-1 text-sm text-muted-foreground">Avanzamento milestone: {progress}%</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Titolo milestone"
          value={titolo}
          onChange={(event) => setTitolo(event.target.value)}
        />
        <Button onClick={addMilestone}>Aggiungi</Button>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropOn(item.id)}
          >
            <div>
              <p className="font-medium">{item.titolo}</p>
              <p className="text-xs text-muted-foreground">Data prevista: {item.data_prevista ?? "N/D"}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => move(item.id, "up")} disabled={idx === 0}>
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => move(item.id, "down")}
                disabled={idx === items.length - 1}
              >
                ↓
              </Button>
              <Button
                variant={item.completata ? "secondary" : "default"}
                size="sm"
                onClick={() => toggleDone(item.id, !item.completata)}
              >
                {item.completata ? "Completata" : "Segna completata"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
