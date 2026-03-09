import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CantiereItem {
  id: string;
  nome: string;
  cliente: string | null;
  stato: string | null;
  data_fine_prevista: string | null;
  avanzamento: number;
}

const statoMap: Record<string, "open" | "assigned" | "resolved" | "outline"> = {
  in_corso: "open",
  pianificato: "assigned",
  completato: "resolved",
  sospeso: "outline",
};

export function CantieriOverviewList({ items }: { items: CantiereItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Cantieri in corso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[#4A5068]">Nessun cantiere in corso</p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[#E8EAF0] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Link href={`/admin/cantieri/${item.id}`} className="font-semibold text-[#0A0C14] hover:text-[#3B6FE8]">
                  {item.nome}
                </Link>
                <Badge variant={statoMap[item.stato ?? ""] ?? "outline"}>{item.stato ?? "n/d"}</Badge>
              </div>

              <p className="text-sm text-[#4A5068]">Cliente: {item.cliente ?? "N/D"}</p>
              <p className="mb-3 text-xs text-[#9199B1]">Fine prevista: {item.data_fine_prevista ?? "N/D"}</p>

              <Progress value={item.avanzamento} className="h-2 bg-[#EEF3FF]" />
              <p className="mt-2 text-xs font-medium text-[#4A5068]">Avanzamento: {item.avanzamento}%</p>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
