import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CantiereCardProps {
  id: string;
  nome: string;
  cliente: string | null;
  stato: string | null;
  avanzamento: number;
  data_fine_prevista: string | null;
  dipendentiCount: number;
}

const statoMap: Record<string, "open" | "assigned" | "resolved" | "outline"> = {
  in_corso: "open",
  pianificato: "assigned",
  completato: "resolved",
  sospeso: "outline",
};

export function CantiereCard(cantiere: CantiereCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <Link
            href={`/admin/cantieri/${cantiere.id}`}
            className="font-bold tracking-[-0.02em] text-[#0A0C14] hover:text-[#3B6FE8]"
          >
            {cantiere.nome}
          </Link>
          <Badge variant={statoMap[cantiere.stato ?? ""] ?? "outline"}>{cantiere.stato ?? "n/d"}</Badge>
        </div>

        <p className="text-sm text-[#4A5068]">Cliente: {cantiere.cliente ?? "N/D"}</p>
        <p className="text-xs text-[#9199B1]">Fine prevista: {cantiere.data_fine_prevista ?? "N/D"}</p>
        <p className="text-xs text-[#9199B1]">Dipendenti: {cantiere.dipendentiCount}</p>

        <div className="mt-4 space-y-2">
          <Progress value={cantiere.avanzamento} className="h-2 bg-[#EEF3FF]" />
          <p className="text-xs font-medium text-[#4A5068]">Avanzamento: {cantiere.avanzamento}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
