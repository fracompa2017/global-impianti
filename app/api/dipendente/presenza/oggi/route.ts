import { format } from "date-fns";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: presenza, error } = await supabase
    .from("timbrature")
    .select("id, data, tipo_giornata, created_at")
    .eq("dipendente_id", user.id)
    .eq("data", today)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ presenza: presenza ?? null });
}
