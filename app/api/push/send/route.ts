import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWebPush } from "@/lib/push/web-push";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const destinatarioId = body.destinatarioId as string | undefined;
  const title = body.title as string | undefined;
  const message = body.message as string | undefined;

  if (!destinatarioId || !title || !message) {
    return NextResponse.json({ error: "Payload notifica incompleto" }, { status: 400 });
  }

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

  const admin = createAdminClient();
  const { data: destinatario } = await admin
    .from("profiles")
    .select("push_subscription")
    .eq("id", destinatarioId)
    .single();

  if (!destinatario?.push_subscription) {
    return NextResponse.json({ error: "Dipendente non iscritto alle push" }, { status: 400 });
  }

  try {
    await sendWebPush(destinatario.push_subscription as any, {
      title,
      body: message,
      url: "/dipendente/home",
    });

    await admin.from("notifiche").insert({
      destinatario_id: destinatarioId,
      titolo: title,
      messaggio: message,
      tipo: "push",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore invio push",
      },
      { status: 500 }
    );
  }
}
