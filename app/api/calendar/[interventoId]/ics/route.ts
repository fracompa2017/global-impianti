import { NextResponse } from "next/server";

import { generateICSFile } from "@/lib/calendar/ics";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: { interventoId: string } }
) {
  const { interventoId } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: intervento } = await supabase
    .from("interventi")
    .select(
      "id, data_intervento, ora_inizio, ora_fine, note_pianificazione, segnalazione_id, segnalazioni(codice, titolo, descrizione, indirizzo)"
    )
    .eq("id", interventoId)
    .single();

  if (!intervento) {
    return NextResponse.json({ error: "Intervento non trovato" }, { status: 404 });
  }

  const safe = intervento as any;
  const seg = safe.segnalazioni ?? {};

  const ics = generateICSFile({
    id: safe.id,
    codice: seg.codice ?? `SEG-${safe.id}`,
    titoloSegnalazione: seg.titolo ?? "Intervento",
    dataIntervento: safe.data_intervento,
    oraInizio: safe.ora_inizio,
    oraFine: safe.ora_fine,
    location: seg.indirizzo ?? "",
    descrizioneProblema: seg.descrizione ?? "",
    notePianificazione: safe.note_pianificazione ?? "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=intervento-${seg.codice ?? safe.id}.ics`,
    },
  });
}
