import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DipendenteReportPage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data: reports } = profile
    ? await supabase
        .from("report_giornalieri")
        .select("id, data, created_at, testo, cantiere_id, cantieri(nome)")
        .eq("dipendente_id", profile.id)
        .order("data", { ascending: false })
        .limit(12)
    : { data: [] as any[] };

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">Report</h1>
          <p className="text-sm text-[#4A5068]">Compila e consulta i tuoi report giornalieri</p>
        </div>
        <Button asChild>
          <Link href="/dipendente/report/nuovo">Nuovo report</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Ultimi report inviati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(reports ?? []).length === 0 ? (
            <p className="text-sm text-[#4A5068]">Nessun report inviato.</p>
          ) : (
            (reports ?? []).map((report: any) => (
              <article key={report.id} className="rounded-xl border border-[#E8EAF0] bg-white p-3">
                <p className="text-sm font-semibold text-[#0A0C14]">
                  {report.cantieri?.nome ?? "Cantiere non assegnato"}
                </p>
                <p className="text-xs text-[#4A5068]">{report.data}</p>
                {report.testo ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[#4A5068]">{report.testo}</p>
                ) : null}
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
