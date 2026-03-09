import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { ReportDocument } from "@/lib/pdf/report-document";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();

  const { data: report, error } = await supabase
    .from("report_giornalieri")
    .select("id, data, testo, materiali_utilizzati, problemi_riscontrati, cantieri(nome), profiles(full_name)")
    .eq("id", id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    React.createElement(ReportDocument, {
      data: {
        dipendente: (report as any).profiles?.full_name ?? "Dipendente",
        cantiere: (report as any).cantieri?.nome ?? "Cantiere",
        data: report.data,
        testo: report.testo ?? "",
        materiali: report.materiali_utilizzati ?? undefined,
        problemi: report.problemi_riscontrati ?? undefined,
      },
    })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=report-${id}.pdf`,
    },
  });
}
