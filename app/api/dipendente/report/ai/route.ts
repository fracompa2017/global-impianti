import { NextResponse } from "next/server";

import { generateReportGiornaliero } from "@/lib/ai/claude";
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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "dipendente") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    cantiere?: string;
    data?: string;
    dipendente?: string;
    descrizione_lavori?: string;
    materiali_utilizzati?: string;
    problemi_riscontrati?: string;
    n_foto_allegate?: number;
  };

  if (!body.descrizione_lavori?.trim()) {
    return NextResponse.json({ error: "Descrizione lavori obbligatoria" }, { status: 400 });
  }

  try {
    const testo = await generateReportGiornaliero({
      cantiere: body.cantiere?.trim() || "Cantiere non assegnato",
      dipendente: body.dipendente?.trim() || profile.full_name || "Tecnico",
      data: body.data?.trim() || new Date().toISOString().slice(0, 10),
      descrizione_lavori: body.descrizione_lavori.trim(),
      materiali_utilizzati: body.materiali_utilizzati?.trim() || undefined,
      problemi_riscontrati: body.problemi_riscontrati?.trim() || undefined,
      n_foto_allegate:
        typeof body.n_foto_allegate === "number" && Number.isFinite(body.n_foto_allegate)
          ? Math.max(0, Math.floor(body.n_foto_allegate))
          : 0,
    });

    return NextResponse.json({ testo });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore generazione AI",
      },
      { status: 500 }
    );
  }
}
