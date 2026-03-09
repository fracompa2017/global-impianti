import { format } from "date-fns";
import { NextResponse } from "next/server";

import { sendWebPush } from "@/lib/push/web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FOTO = 20;
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

function isAcceptedMime(file: File) {
  const mime = file.type.toLowerCase();
  if (ACCEPTED_MIME.has(mime)) {
    return true;
  }

  const lower = file.name.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"].some((ext) =>
    lower.endsWith(ext)
  );
}

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

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
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "dipendente") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const formData = await request.formData();

  const descrizioneLavori = String(formData.get("descrizione_lavori") ?? "").trim();
  const materialiUtilizzati = String(formData.get("materiali_utilizzati") ?? "").trim();
  const problemiRiscontrati = String(formData.get("problemi_riscontrati") ?? "").trim();
  const testoGeneratoAi = String(formData.get("testo_generato_ai") ?? "").trim();
  const rawData = String(formData.get("data") ?? "").trim();
  const cantiereId = String(formData.get("cantiere_id") ?? "").trim() || null;

  if (!descrizioneLavori) {
    return NextResponse.json({ error: "Descrizione lavori obbligatoria" }, { status: 400 });
  }

  const reportDate = /^\d{4}-\d{2}-\d{2}$/.test(rawData)
    ? rawData
    : format(new Date(), "yyyy-MM-dd");

  const existingToday = await supabase
    .from("report_giornalieri")
    .select("id")
    .eq("dipendente_id", user.id)
    .eq("data", reportDate)
    .maybeSingle();

  if (existingToday.error) {
    return NextResponse.json({ error: existingToday.error.message }, { status: 400 });
  }

  if (existingToday.data?.id) {
    return NextResponse.json({ error: "Report giornaliero gia inviato per questa data" }, { status: 409 });
  }

  const files = formData
    .getAll("foto")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_FOTO) {
    return NextResponse.json(
      { error: `Massimo ${MAX_FOTO} foto per report` },
      { status: 400 }
    );
  }

  if (files.some((file) => !isAcceptedMime(file))) {
    return NextResponse.json(
      { error: "Formato foto non supportato. Usa JPG, PNG, HEIC o WEBP" },
      { status: 400 }
    );
  }

  let normalizedCantiereId = cantiereId;
  if (!normalizedCantiereId) {
    const { data: turnoOggi } = await supabase
      .from("turni")
      .select("cantiere_id")
      .eq("dipendente_id", user.id)
      .eq("data", reportDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    normalizedCantiereId = turnoOggi?.cantiere_id ?? null;
  }

  const { data: report, error: reportError } = await supabase
    .from("report_giornalieri")
    .insert({
      dipendente_id: user.id,
      cantiere_id: normalizedCantiereId,
      data: reportDate,
      testo: descrizioneLavori,
      testo_generato_ai: testoGeneratoAi || null,
      materiali_utilizzati: materialiUtilizzati || null,
      problemi_riscontrati: problemiRiscontrati || null,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: reportError?.message ?? "Errore salvataggio report" }, { status: 400 });
  }

  let adminClient: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminClient = createAdminClient();
  } catch {
    adminClient = null;
  }

  const storageClient = adminClient ?? supabase;

  try {
    if (files.length > 0) {
      const fotoRows: Array<{ report_id: string; url: string; caption: string | null }> = [];

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const fileName = safeFileName(file.name || `foto-${Date.now()}.jpg`) || `foto-${Date.now()}.jpg`;
        const path = `report-foto/${report.id}/${Date.now()}-${fileName}`;

        const { error: uploadError } = await storageClient.storage
          .from("report-foto")
          .upload(path, Buffer.from(bytes), {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const {
          data: { publicUrl },
        } = storageClient.storage.from("report-foto").getPublicUrl(path);

        fotoRows.push({
          report_id: report.id,
          url: publicUrl,
          caption: null,
        });
      }

      if (fotoRows.length > 0) {
        const { error: fotoInsertError } = await storageClient.from("report_foto").insert(fotoRows);
        if (fotoInsertError) {
          throw new Error(fotoInsertError.message);
        }
      }
    }
  } catch (error) {
    await supabase.from("report_giornalieri").delete().eq("id", report.id);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore upload foto",
      },
      { status: 500 }
    );
  }

  if (adminClient) {
    const { data: admins } = await adminClient
      .from("profiles")
      .select("id, push_subscription")
      .eq("role", "admin");

    const title = "Report ricevuto";
    const message = `${profile.full_name ?? "Dipendente"} ha inviato il report del ${reportDate}`;

    if ((admins ?? []).length > 0) {
      await adminClient.from("notifiche").insert(
        admins!.map((admin) => ({
          destinatario_id: admin.id,
          titolo: title,
          messaggio: message,
          tipo: "report",
        }))
      );

      await Promise.allSettled(
        admins!
          .filter((admin) => !!admin.push_subscription)
          .map((admin) =>
            sendWebPush(admin.push_subscription as any, {
              title,
              body: message,
              url: "/admin/dashboard",
            })
          )
      );
    }
  }

  return NextResponse.json({
    ok: true,
    report_id: report.id,
    foto_caricate: files.length,
  });
}
