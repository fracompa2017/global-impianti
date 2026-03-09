import { NextResponse } from "next/server";

import { generaPreventivoAI } from "@/lib/ai/anthropic";
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

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();

  try {
    const contenuto = await generaPreventivoAI({
      cliente: body.cliente,
      descrizioneLavori: body.descrizioneLavori,
      materiali: body.materiali,
      note: body.note,
    });

    return NextResponse.json({ ok: true, contenuto });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore generazione AI",
      },
      { status: 500 }
    );
  }
}
