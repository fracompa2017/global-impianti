import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DipendenteReportPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Report</h1>
        <p className="text-sm text-[#4A5068]">Compila e consulta i tuoi report</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Sezione in aggiornamento</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#4A5068]">
          Usa i flussi gia presenti in Home per report giornalieri e timbrature.
        </CardContent>
      </Card>
    </div>
  );
}
