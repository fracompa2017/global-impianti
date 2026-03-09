import { notFound } from "next/navigation";

import { AssegnazioniTab } from "@/components/admin/assegnazioni-tab";
import { MilestonesManager } from "@/components/admin/milestones-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getCantiereDetails } from "@/lib/supabase/queries";

export default async function CantiereDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const details = await getCantiereDetails(id);
  const supabase = await createClient();

  if (!details.cantiere) {
    notFound();
  }

  const { data: dipendenti } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "dipendente")
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#E8EAF0] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-[#0A0C14]">{details.cantiere.nome}</h1>
            <p className="text-sm text-[#4A5068]">Cliente: {details.cantiere.cliente ?? "N/D"}</p>
          </div>
          <Badge variant="open">{details.cantiere.stato}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline">Modifica</Button>
          <Button variant="secondary">Cambia stato</Button>
        </div>
      </header>

      <Tabs defaultValue="dipendenti">
        <TabsList className="rounded-xl border border-[#E8EAF0] bg-white p-1">
          <TabsTrigger value="dipendenti">Dipendenti assegnati</TabsTrigger>
          <TabsTrigger value="milestones">Timeline / Milestone</TabsTrigger>
          <TabsTrigger value="report">Report Giornalieri</TabsTrigger>
        </TabsList>

        <TabsContent value="dipendenti" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assegnazioni cantiere</CardTitle>
            </CardHeader>
            <CardContent>
              <AssegnazioniTab
                cantiereId={id}
                available={dipendenti ?? []}
                initial={details.assegnati as any}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Milestone e avanzamento</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestonesManager cantiereId={id} initial={details.milestones as any} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Report giornalieri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {details.reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun report disponibile</p>
              ) : (
                details.reports.map((report: any) => (
                  <article key={report.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-medium">{report.profiles?.full_name ?? "Dipendente"}</p>
                      <p className="text-xs text-muted-foreground">{report.data}</p>
                    </div>
                    <p className="text-sm">{report.testo ?? "Nessun testo"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Materiali: {report.materiali_utilizzati ?? "N/D"} | Problemi: {report.problemi_riscontrati ?? "N/D"}
                    </p>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
