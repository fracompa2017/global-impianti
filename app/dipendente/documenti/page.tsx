import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DipendenteDocumentiPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Documenti</h1>
        <p className="text-sm text-[#4A5068]">Archivio documenti personali</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Sezione in aggiornamento</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#4A5068]">
          I documenti recenti sono gia visibili nella Home dipendente.
        </CardContent>
      </Card>
    </div>
  );
}
