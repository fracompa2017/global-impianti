import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  return new Anthropic({ apiKey });
}

export interface ReportInterventoInput {
  descrizioneLavori: string;
  causaGuasto?: string;
  soluzioneAdottata?: string;
  materialiUtilizzati?: string;
  tipoImpianto?: string;
  esito?: string;
}

export interface ReportGiornalieroInput {
  cantiere: string;
  dipendente: string;
  data: string;
  descrizione_lavori: string;
  materiali_utilizzati?: string;
  problemi_riscontrati?: string;
  n_foto_allegate: number;
}

export async function generateReportIntervento(input: ReportInterventoInput) {
  const anthropic = getClient();

  const prompt = `
Genera un report professionale di intervento tecnico in italiano.

Descrizione lavori: ${input.descrizioneLavori}
Causa guasto: ${input.causaGuasto ?? "N/D"}
Soluzione adottata: ${input.soluzioneAdottata ?? "N/D"}
Materiali utilizzati: ${input.materialiUtilizzati ?? "N/D"}
Tipo impianto: ${input.tipoImpianto ?? "N/D"}
Esito: ${input.esito ?? "N/D"}

Restituisci testo formattato con sezioni:
- Descrizione intervento
- Diagnosi e causa
- Soluzione tecnica adottata
- Materiali impiegati
- Esito e raccomandazioni
`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1400,
    temperature: 0.2,
    system:
      "Sei un tecnico senior. Tono professionale, chiaro e orientato a report cliente.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlocks = response.content.filter((c) => c.type === "text");
  return textBlocks.map((b) => b.text).join("\n").trim();
}

export async function analyzeSegnalazione(descrizione: string, tipoImpianto: string) {
  const anthropic = getClient();

  const prompt = `
Analizza questa segnalazione tecnica.

Tipo impianto: ${tipoImpianto}
Descrizione: ${descrizione}

Rispondi SOLO con JSON valido nel formato:
{
  "priorita_suggerita": "bassa|media|alta|critica",
  "tipo_guasto_probabile": "...",
  "possibili_cause": ["..."],
  "materiali_probabilmente_necessari": ["..."],
  "tempo_intervento_stimato": "...",
  "note_tecniche": "..."
}
`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 900,
    temperature: 0.2,
    system:
      "Sei un supervisore tecnico impianti. Output JSON rigoroso senza testo extra.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlocks = response.content.filter((c) => c.type === "text");
  const text = textBlocks.map((b) => b.text).join("\n").trim();
  return JSON.parse(text);
}

export async function generateReportGiornaliero(input: ReportGiornalieroInput) {
  const anthropic = getClient();

  const prompt = `
Genera un report giornaliero professionale in italiano, conciso e adatto alla consegna al cliente.

Cantiere: ${input.cantiere}
Tecnico: ${input.dipendente}
Data: ${input.data}
Descrizione lavori: ${input.descrizione_lavori}
Materiali utilizzati: ${input.materiali_utilizzati ?? "N/D"}
Problemi riscontrati: ${input.problemi_riscontrati ?? "Nessuno"}
Numero foto allegate: ${input.n_foto_allegate}

Formato obbligatorio:
- Intestazione con cantiere, data, tecnico
- Sezione "Lavori eseguiti"
- Sezione "Materiali impiegati" (solo se presenti materiali)
- Sezione "Note tecniche" (solo se presenti problemi o anomalie)
- Footer: "Report corredato da ${input.n_foto_allegate} fotografie"
`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    temperature: 0.2,
    system:
      "Sei un capocantiere tecnico. Scrivi in tono professionale, chiaro, concreto e senza prolissità.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlocks = response.content.filter((c) => c.type === "text");
  return textBlocks.map((b) => b.text).join("\n").trim();
}
