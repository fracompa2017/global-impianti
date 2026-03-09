import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentReportsFeed({
  reports,
}: {
  reports: Array<{
    id: string;
    data: string;
    testo: string | null;
    cantieri?: { nome?: string } | null;
    profiles?: { full_name?: string } | null;
  }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Ultimi report ricevuti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length === 0 ? (
          <p className="text-sm text-[#4A5068]">Nessun report disponibile</p>
        ) : (
          reports.map((report) => (
            <article
              key={report.id}
              className="rounded-2xl border border-[#E8EAF0] bg-white p-4 transition-all hover:border-[#DCE8FF]"
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#0A0C14]">{report.profiles?.full_name ?? "Dipendente"}</p>
                <p className="text-xs text-[#9199B1]">{report.data}</p>
              </div>
              <p className="text-xs text-[#4A5068]">Cantiere: {report.cantieri?.nome ?? "N/D"}</p>
              <p className="mt-2 line-clamp-2 text-sm text-[#0A0C14]">{report.testo ?? "Nessuna nota"}</p>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
