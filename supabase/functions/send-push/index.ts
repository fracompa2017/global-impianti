import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type EventType =
  | "custom"
  | "nuovo_intervento_assegnato"
  | "reminder_intervento"
  | "reminder_report"
  | "segnalazione_critica_creata"
  | "intervento_rimesso_in_guasto"
  | "report_intervento_inviato";

interface Payload {
  event?: EventType | string;
  destinatarioId?: string;
  titolo?: string;
  messaggio?: string;
  tipo?: string;
  interventoId?: string;
  segnalazioneId?: string;
  reportId?: string;
  dipendenteId?: string;
  motivazione?: string;
  nowIso?: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeEvent(event: string | undefined): EventType {
  const value = (event ?? "custom").trim().toLowerCase();
  switch (value) {
    case "nuovo_intervento_assegnato":
      return "nuovo_intervento_assegnato";
    case "reminder_intervento":
      return "reminder_intervento";
    case "reminder_report":
      return "reminder_report";
    case "segnalazione_critica_creata":
      return "segnalazione_critica_creata";
    case "intervento_rimesso_in_guasto":
      return "intervento_rimesso_in_guasto";
    case "report_intervento_inviato":
      return "report_intervento_inviato";
    default:
      return "custom";
  }
}

function fmtDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-");
  if (!y || !m || !d) return dateIso;
  return `${d}/${m}/${y}`;
}

function fmtTime(time: string | null): string {
  if (!time) return "--:--";
  return time.slice(0, 5);
}

function shortText(value: string | null | undefined, max = 90): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

async function insertNotifications(
  supabase: ReturnType<typeof createClient>,
  recipientIds: string[],
  titolo: string,
  messaggio: string,
  tipo: string
): Promise<number> {
  const uniqueRecipients = [...new Set(recipientIds.filter(Boolean))];
  if (uniqueRecipients.length === 0) {
    return 0;
  }

  const rows = uniqueRecipients.map((id) => ({
    destinatario_id: id,
    titolo,
    messaggio,
    tipo,
  }));

  const { error } = await supabase.from("notifiche").insert(rows);
  if (error) {
    throw new Error(`Insert notifiche fallito: ${error.message}`);
  }

  return rows.length;
}

async function getAdminIds(supabase: ReturnType<typeof createClient>): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (error) {
    throw new Error(`Lettura admin fallita: ${error.message}`);
  }

  return (data ?? []).map((row) => String(row.id));
}

async function getInterventoSummary(
  supabase: ReturnType<typeof createClient>,
  interventoId: string
) {
  const { data, error } = await supabase
    .from("interventi")
    .select(
      "id, data_intervento, ora_inizio, ora_fine, note_pianificazione, segnalazione_id, segnalazioni(codice, titolo, descrizione, indirizzo, cliente)"
    )
    .eq("id", interventoId)
    .single();

  if (error || !data) {
    throw new Error(`Intervento non trovato: ${interventoId}`);
  }

  return data as {
    id: string;
    data_intervento: string;
    ora_inizio: string | null;
    ora_fine: string | null;
    note_pianificazione: string | null;
    segnalazione_id: string;
    segnalazioni: {
      codice: string | null;
      titolo: string | null;
      descrizione: string | null;
      indirizzo: string | null;
      cliente: string | null;
    } | null;
  };
}

async function getAssegnatiIntervento(
  supabase: ReturnType<typeof createClient>,
  interventoId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("intervento_assegnazioni")
    .select("dipendente_id")
    .eq("intervento_id", interventoId);

  if (error) {
    throw new Error(`Lettura assegnazioni fallita: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => (row.dipendente_id ? String(row.dipendente_id) : ""))
    .filter(Boolean);
}

async function handleNuovoIntervento(
  supabase: ReturnType<typeof createClient>,
  payload: Payload
): Promise<number> {
  if (!payload.interventoId) {
    throw new Error("interventoId obbligatorio per nuovo_intervento_assegnato");
  }

  const intervento = await getInterventoSummary(supabase, payload.interventoId);
  const seg = intervento.segnalazioni ?? {};
  const allAssegnati = await getAssegnatiIntervento(supabase, payload.interventoId);
  const recipients = payload.dipendenteId
    ? allAssegnati.filter((id) => id === payload.dipendenteId)
    : allAssegnati;

  const titolo = "Nuovo intervento assegnato";
  const messaggio = `[${seg.codice ?? `SEG-${intervento.id}`}] - ${
    seg.titolo ?? "Intervento"
  } - ${fmtDate(intervento.data_intervento)} ore ${fmtTime(intervento.ora_inizio)}`;

  return insertNotifications(
    supabase,
    recipients,
    titolo,
    messaggio,
    `intervento_assegnato:/dipendente/interventi/${intervento.id}`
  );
}

async function handleReminderIntervento(
  supabase: ReturnType<typeof createClient>,
  payload: Payload
): Promise<number> {
  const now = payload.nowIso ? new Date(payload.nowIso) : new Date();

  if (payload.interventoId) {
    const intervento = await getInterventoSummary(supabase, payload.interventoId);
    const seg = intervento.segnalazioni ?? {};
    const recipients = await getAssegnatiIntervento(supabase, payload.interventoId);

    const messaggio = `${seg.titolo ?? "Intervento"} - ${
      seg.indirizzo ?? "Indirizzo non disponibile"
    } - ore ${fmtTime(intervento.ora_inizio)}`;

    return insertNotifications(
      supabase,
      recipients,
      "Intervento domani",
      messaggio,
      "reminder_intervento_domani"
    );
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  const { data: interventi, error } = await supabase
    .from("interventi")
    .select(
      "id, data_intervento, ora_inizio, segnalazioni(codice, titolo, indirizzo)"
    )
    .eq("data_intervento", tomorrowIso);

  if (error) {
    throw new Error(`Lettura interventi domani fallita: ${error.message}`);
  }

  let total = 0;
  for (const intervento of interventi ?? []) {
    const recipients = await getAssegnatiIntervento(supabase, String(intervento.id));
    const seg = (intervento as { segnalazioni?: Record<string, string | null> })
      .segnalazioni ?? {
      codice: null,
      titolo: null,
      indirizzo: null,
    };
    const messaggio = `${seg.titolo ?? "Intervento"} - ${
      seg.indirizzo ?? "Indirizzo non disponibile"
    } - ore ${fmtTime((intervento as { ora_inizio: string | null }).ora_inizio)}`;

    total += await insertNotifications(
      supabase,
      recipients,
      "Intervento domani",
      messaggio,
      "reminder_intervento_domani"
    );
  }

  return total;
}

async function handleReminderReport(
  supabase: ReturnType<typeof createClient>,
  payload: Payload
): Promise<number> {
  const now = payload.nowIso ? new Date(payload.nowIso) : new Date();
  const threshold = now.getTime() - 2 * 60 * 60 * 1000;

  if (payload.interventoId) {
    const intervento = await getInterventoSummary(supabase, payload.interventoId);
    const ass = await getAssegnatiIntervento(supabase, payload.interventoId);
    const { data: reports, error: reportsError } = await supabase
      .from("intervento_report")
      .select("dipendente_id")
      .eq("intervento_id", payload.interventoId);
    if (reportsError) {
      throw new Error(`Lettura report fallita: ${reportsError.message}`);
    }
    const reportedBy = new Set(
      (reports ?? []).map((r) => (r.dipendente_id ? String(r.dipendente_id) : ""))
    );
    const pending = ass.filter((id) => !reportedBy.has(id));
    const titoloSegnalazione =
      intervento.segnalazioni?.titolo ?? `Intervento ${intervento.id}`;

    return insertNotifications(
      supabase,
      pending,
      "Report intervento mancante",
      `Compila il report per ${titoloSegnalazione}`,
      "reminder_report_mancante"
    );
  }

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 3);
  const fromIso = fromDate.toISOString().slice(0, 10);

  const { data: interventi, error } = await supabase
    .from("interventi")
    .select("id, data_intervento, ora_fine, segnalazioni(titolo)")
    .not("ora_fine", "is", null)
    .gte("data_intervento", fromIso)
    .lte("data_intervento", now.toISOString().slice(0, 10));

  if (error) {
    throw new Error(`Lettura interventi per reminder report fallita: ${error.message}`);
  }

  let total = 0;
  for (const raw of interventi ?? []) {
    const row = raw as {
      id: string;
      data_intervento: string;
      ora_fine: string | null;
      segnalazioni?: { titolo: string | null } | null;
    };

    if (!row.ora_fine) continue;
    const endAt = new Date(`${row.data_intervento}T${row.ora_fine}`);
    if (Number.isNaN(endAt.getTime()) || endAt.getTime() > threshold) continue;

    const assegnati = await getAssegnatiIntervento(supabase, String(row.id));
    if (assegnati.length === 0) continue;

    const { data: reports, error: reportsError } = await supabase
      .from("intervento_report")
      .select("dipendente_id")
      .eq("intervento_id", row.id);
    if (reportsError) {
      throw new Error(`Lettura report fallita: ${reportsError.message}`);
    }

    const reportedBy = new Set(
      (reports ?? []).map((r) => (r.dipendente_id ? String(r.dipendente_id) : ""))
    );
    const pending = assegnati.filter((id) => !reportedBy.has(id));
    if (pending.length === 0) continue;

    total += await insertNotifications(
      supabase,
      pending,
      "Report intervento mancante",
      `Compila il report per ${row.segnalazioni?.titolo ?? `Intervento ${row.id}`}`,
      "reminder_report_mancante"
    );
  }

  return total;
}

async function handleSegnalazioneCritica(
  supabase: ReturnType<typeof createClient>,
  payload: Payload
): Promise<number> {
  if (!payload.segnalazioneId) {
    throw new Error("segnalazioneId obbligatorio per segnalazione_critica_creata");
  }

  const { data, error } = await supabase
    .from("segnalazioni")
    .select("titolo, cliente, indirizzo, priorita")
    .eq("id", payload.segnalazioneId)
    .single();

  if (error || !data) {
    throw new Error(`Segnalazione non trovata: ${payload.segnalazioneId}`);
  }

  if (data.priorita !== "critica") {
    return 0;
  }

  const adminIds = await getAdminIds(supabase);
  const messaggio = `${data.titolo} - ${data.cliente ?? "Cliente N/D"} - ${
    data.indirizzo ?? "Indirizzo N/D"
  }`;

  return insertNotifications(
    supabase,
    adminIds,
    "🔴 Segnalazione CRITICA",
    messaggio,
    "segnalazione_critica"
  );
}

async function handleInterventoRimessoGuasto(
  supabase: ReturnType<typeof createClient>,
  payload: Payload
): Promise<number> {
  if (!payload.reportId && !payload.interventoId) {
    throw new Error("reportId o interventoId obbligatorio per intervento_rimesso_in_guasto");
  }

  let interventoId = payload.interventoId;
  let motivazione = payload.motivazione ?? "";

  if (payload.reportId) {
    const { data: report, error: reportError } = await supabase
      .from("intervento_report")
      .select("intervento_id, motivo_rimessa_guasto")
      .eq("id", payload.reportId)
      .single();
    if (reportError || !report) {
      throw new Error(`Report non trovato: ${payload.reportId}`);
    }
    interventoId = String(report.intervento_id);
    motivazione = report.motivo_rimessa_guasto ?? motivazione;
  }

  const intervento = await getInterventoSummary(supabase, String(interventoId));
  const seg = intervento.segnalazioni ?? {};
  const adminIds = await getAdminIds(supabase);

  const messaggio = `[${seg.codice ?? `SEG-${intervento.id}`}] ${
    seg.titolo ?? "Segnalazione"
  } - ${shortText(motivazione || "Motivazione non disponibile", 110)}`;

  return insertNotifications(
    supabase,
    adminIds,
    "🔄 Rimessa in guasto",
    messaggio,
    "intervento_rimesso_in_guasto"
  );
}

async function handleReportInterventoInviato(
  supabase: ReturnType<typeof createClient>,
  payload: Payload
): Promise<number> {
  if (!payload.reportId) {
    throw new Error("reportId obbligatorio per report_intervento_inviato");
  }

  const { data: report, error: reportError } = await supabase
    .from("intervento_report")
    .select("id, intervento_id, dipendente_id, esito")
    .eq("id", payload.reportId)
    .single();

  if (reportError || !report) {
    throw new Error(`Report non trovato: ${payload.reportId}`);
  }

  const { data: dipendente } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", report.dipendente_id)
    .single();

  const intervento = await getInterventoSummary(supabase, String(report.intervento_id));
  const seg = intervento.segnalazioni ?? {};
  const adminIds = await getAdminIds(supabase);

  const messaggio = `${dipendente?.full_name ?? "Dipendente"} ha completato [${
    seg.codice ?? `SEG-${intervento.id}`
  }] - Esito: ${report.esito ?? "n/d"}`;

  return insertNotifications(
    supabase,
    adminIds,
    "Report ricevuto",
    messaggio,
    "report_intervento_inviato"
  );
}

async function handleCustom(
  supabase: ReturnType<typeof createClient>,
  payload: Payload
): Promise<number> {
  if (!payload.destinatarioId || !payload.titolo || !payload.messaggio) {
    throw new Error("Payload incompleto per notifica custom");
  }

  const { data: destinatario, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", payload.destinatarioId)
    .single();

  if (error || !destinatario?.id) {
    throw new Error("Destinatario non trovato");
  }

  return insertNotifications(
    supabase,
    [payload.destinatarioId],
    payload.titolo,
    payload.messaggio,
    payload.tipo ?? "push_edge"
  );
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRole);

  try {
    const payload = (await request.json()) as Payload;
    const event = normalizeEvent(payload.event);

    let sent = 0;

    switch (event) {
      case "nuovo_intervento_assegnato":
        sent = await handleNuovoIntervento(supabase, payload);
        break;
      case "reminder_intervento":
        sent = await handleReminderIntervento(supabase, payload);
        break;
      case "reminder_report":
        sent = await handleReminderReport(supabase, payload);
        break;
      case "segnalazione_critica_creata":
        sent = await handleSegnalazioneCritica(supabase, payload);
        break;
      case "intervento_rimesso_in_guasto":
        sent = await handleInterventoRimessoGuasto(supabase, payload);
        break;
      case "report_intervento_inviato":
        sent = await handleReportInterventoInviato(supabase, payload);
        break;
      case "custom":
      default:
        sent = await handleCustom(supabase, payload);
    }

    return json(200, { ok: true, event, sent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore imprevisto";
    return json(400, { ok: false, error: message });
  }
});
