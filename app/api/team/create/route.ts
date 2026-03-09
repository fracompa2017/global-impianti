import { NextResponse } from "next/server";
import { format } from "date-fns";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_RESOURCES = new Set([
  "employee",
  "cantiere",
  "milestone",
  "milestone-toggle",
  "milestone-order",
  "assegnazione-add",
  "assegnazione-remove",
]);

export async function POST(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? "employee";
  const body = await request.json().catch(() => ({}));

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

  if (!profile) {
    return NextResponse.json({ error: "Profilo utente non trovato" }, { status: 403 });
  }

  if (ADMIN_RESOURCES.has(resource) && profile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  if (resource === "employee") {
    const adminClient = createAdminClient();
    const { fullName, email, phone, ruoloCantiere } = body as {
      fullName: string;
      email: string;
      phone?: string;
      ruoloCantiere?: string;
    };

    if (!email || !fullName) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const temporaryPassword = `${Math.random().toString(36).slice(2, 8)}A!9`;

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        ruolo_cantiere_default: ruoloCantiere ?? null,
      },
    });

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? "Errore creazione utente" }, { status: 400 });
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: created.user.id,
          full_name: fullName,
          email,
          phone: phone ?? null,
          role: "dipendente",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
        : undefined,
    });

    return NextResponse.json({ ok: true, temporaryPassword });
  }

  if (resource === "cantiere") {
    const { nome, cliente, indirizzo, descrizione, dataFinePrevista } = body as {
      nome: string;
      cliente?: string;
      indirizzo?: string;
      descrizione?: string;
      dataFinePrevista?: string;
    };

    if (!nome) {
      return NextResponse.json({ error: "Nome cantiere obbligatorio" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cantieri")
      .insert({
        nome,
        cliente: cliente ?? null,
        indirizzo: indirizzo ?? null,
        descrizione: descrizione ?? null,
        stato: "pianificato",
        data_fine_prevista: dataFinePrevista ?? null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  }

  if (resource === "milestone") {
    const cantiereId = url.searchParams.get("cantiereId");
    const { titolo } = body as { titolo: string };

    if (!cantiereId || !titolo) {
      return NextResponse.json({ error: "Dati milestone mancanti" }, { status: 400 });
    }

    const { data: current } = await supabase
      .from("milestones")
      .select("ordine")
      .eq("cantiere_id", cantiereId)
      .order("ordine", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (current?.ordine ?? 0) + 1;

    const { data: milestone, error } = await supabase
      .from("milestones")
      .insert({
        cantiere_id: cantiereId,
        titolo,
        ordine: nextOrder,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ milestone });
  }

  if (resource === "milestone-toggle") {
    const id = url.searchParams.get("id");
    const { completata } = body as { completata: boolean };

    if (!id) {
      return NextResponse.json({ error: "Milestone non valida" }, { status: 400 });
    }

    const payload = {
      completata,
      data_completamento: completata ? format(new Date(), "yyyy-MM-dd") : null,
      percentuale_avanzamento: completata ? 100 : 0,
    };

    const { error } = await supabase.from("milestones").update(payload).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (resource === "milestone-order") {
    const { order } = body as { order: Array<{ id: string; ordine: number }> };

    for (const item of order) {
      await supabase.from("milestones").update({ ordine: item.ordine }).eq("id", item.id);
    }

    return NextResponse.json({ ok: true });
  }

  if (resource === "assegnazione-add") {
    const { cantiereId, dipendenteId, ruoloCantiere } = body as {
      cantiereId: string;
      dipendenteId: string;
      ruoloCantiere?: string;
    };

    const { data, error } = await supabase
      .from("cantiere_assegnazioni")
      .insert({
        cantiere_id: cantiereId,
        dipendente_id: dipendenteId,
        ruolo_cantiere: ruoloCantiere ?? null,
        data_inizio: format(new Date(), "yyyy-MM-dd"),
      })
      .select("id, ruolo_cantiere, data_inizio, data_fine, dipendente_id, profiles(full_name, email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ assegnazione: data });
  }

  if (resource === "assegnazione-remove") {
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID assegnazione mancante" }, { status: 400 });
    }

    const { error } = await supabase.from("cantiere_assegnazioni").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (resource === "timbratura-entry") {
    const { userId, cantiereId } = body as { userId: string; cantiereId: string };

    if (!userId || !cantiereId) {
      return NextResponse.json({ error: "Dati timbratura mancanti" }, { status: 400 });
    }

    if (profile?.role === "dipendente" && userId !== user.id) {
      return NextResponse.json({ error: "Operazione non consentita" }, { status: 403 });
    }

    const today = format(new Date(), "yyyy-MM-dd");

    const { data: existing } = await supabase
      .from("timbrature")
      .select("id")
      .eq("dipendente_id", userId)
      .eq("data", today)
      .is("ora_uscita", null)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id });
    }

    const { data, error } = await supabase
      .from("timbrature")
      .insert({
        dipendente_id: userId,
        cantiere_id: cantiereId,
        data: today,
        ora_entrata: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  }

  if (resource === "timbratura-exit") {
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: "Utente mancante" }, { status: 400 });
    }

    if (profile?.role === "dipendente" && userId !== user.id) {
      return NextResponse.json({ error: "Operazione non consentita" }, { status: 403 });
    }

    const today = format(new Date(), "yyyy-MM-dd");

    const { data: row, error: rowError } = await supabase
      .from("timbrature")
      .select("id")
      .eq("dipendente_id", userId)
      .eq("data", today)
      .is("ora_uscita", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (rowError || !row) {
      return NextResponse.json({ error: "Timbratura entrata non trovata" }, { status: 400 });
    }

    const { error } = await supabase
      .from("timbrature")
      .update({ ora_uscita: new Date().toISOString() })
      .eq("id", row.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (resource === "report") {
    const { userId, cantiereId, data, testo, meteo, materiali, problemi } = body as {
      userId: string;
      cantiereId: string;
      data: string;
      testo: string;
      meteo?: string;
      materiali?: string;
      problemi?: string;
    };

    if (profile?.role === "dipendente" && userId !== user.id) {
      return NextResponse.json({ error: "Operazione non consentita" }, { status: 403 });
    }

    if (!userId || !cantiereId || !data) {
      return NextResponse.json({ error: "Dati report mancanti" }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from("report_giornalieri")
      .insert({
        dipendente_id: userId,
        cantiere_id: cantiereId,
        data,
        testo,
        meteo: meteo ?? null,
        materiali_utilizzati: materiali ?? null,
        problemi_riscontrati: problemi ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: row.id });
  }

  return NextResponse.json({ error: "Risorsa non supportata" }, { status: 400 });
}
