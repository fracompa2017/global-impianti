import { format } from "date-fns";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const payload = (await request.json().catch(() => ({}))) as {
    tipo_giornata?: "intera" | "mezza";
  };

  const tipoGiornata = payload.tipo_giornata ?? "intera";

  if (tipoGiornata !== "intera" && tipoGiornata !== "mezza") {
    return NextResponse.json({ error: "Tipo giornata non valido" }, { status: 400 });
  }

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: existing } = await supabase
    .from("timbrature")
    .select("id, data, tipo_giornata, created_at")
    .eq("dipendente_id", user.id)
    .eq("data", today)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Presenza gia confermata per oggi", existing },
      { status: 409 }
    );
  }

  const { data: presenza, error } = await supabase
    .from("timbrature")
    .insert({
      dipendente_id: user.id,
      cantiere_id: null,
      data: today,
      tipo_giornata: tipoGiornata,
      note: null,
    })
    .select("id, data, tipo_giornata, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: conflict } = await supabase
        .from("timbrature")
        .select("id, data, tipo_giornata, created_at")
        .eq("dipendente_id", user.id)
        .eq("data", today)
        .maybeSingle();

      return NextResponse.json(
        { error: "Presenza gia confermata per oggi", existing: conflict },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ presenza });
}
