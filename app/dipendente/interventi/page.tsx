import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DipendenteInterventiPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Interventi</h1>
        <p className="text-sm text-[#4A5068]">Interventi assegnati e pianificazioni</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Sezione in aggiornamento</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#4A5068]">
          Il modulo interventi resta disponibile nel flusso operativo del portale.
        </CardContent>
      </Card>
    </div>
  );
}
