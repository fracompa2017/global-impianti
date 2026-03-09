"use client";

import Link from "next/link";

import { ConfermaPresenza } from "@/components/dipendente/ConfermaPresenza";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClockReportPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ConfermaPresenza />

      <Card>
        <CardHeader>
          <CardTitle>Report Giornaliero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[#4A5068]">
            Compila il report della giornata con descrizione lavori, materiali e foto del cantiere.
          </p>
          <Button asChild>
            <Link href="/dipendente/report/nuovo">Apri report</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
