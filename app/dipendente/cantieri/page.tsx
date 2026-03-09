import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DipendenteCantieriPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Cantieri</h1>
        <p className="text-sm text-[#4A5068]">Panoramica cantieri assegnati</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Sezione in aggiornamento</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#4A5068]">
          Le funzionalita operative restano disponibili nella Home dipendente.
        </CardContent>
      </Card>
    </div>
  );
}
