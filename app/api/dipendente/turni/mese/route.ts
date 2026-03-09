import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "dipendente") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const url = new URL(request.url);
  const mese = Number(url.searchParams.get("mese"));
  const anno = Number(url.searchParams.get("anno"));

  if (!Number.isInteger(mese) || !Number.isInteger(anno) || mese < 1 || mese > 12 || anno < 2000 || anno > 2100) {
    return NextResponse.json({ error: "Parametri mese/anno non validi" }, { status: 400 });
  }

  const baseDate = new Date(anno, mese - 1, 1);
  const from = format(startOfMonth(baseDate), "yyyy-MM-dd");
  const to = format(endOfMonth(baseDate), "yyyy-MM-dd");

  const { data: turni, error } = await supabase
    .from("turni")
    .select("id, data, ora_inizio, ora_fine, note, cantieri(nome, indirizzo)")
    .eq("dipendente_id", user.id)
    .gte("data", from)
    .lte("data", to)
    .order("data", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const result = (turni ?? []).map((turno) => ({
    id: turno.id,
    data: turno.data,
    ora_inizio: turno.ora_inizio,
    ora_fine: turno.ora_fine,
    note: turno.note,
    cantiere: turno.cantieri
      ? {
          nome: (turno.cantieri as any).nome,
          indirizzo: (turno.cantieri as any).indirizzo ?? null,
        }
      : null,
  }));

  return NextResponse.json({ turni: result });
}
