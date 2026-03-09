import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  return new Anthropic({ apiKey });
}

export async function generaPreventivoAI(input: {
  cliente: string;
  descrizioneLavori: string;
  materiali?: string;
  note?: string;
}) {
  const anthropic = getClient();

  const prompt = `
Genera un preventivo tecnico professionale per Global Impianti.

Cliente: ${input.cliente}
Descrizione lavori: ${input.descrizioneLavori}
Materiali: ${input.materiali ?? "N/D"}
Note: ${input.note ?? "N/D"}

Rispondi SOLO con JSON valido nel formato:
{
  "titolo": "...",
  "voci": [{"descrizione": "...", "quantita": 1, "prezzo_unitario": 0}],
  "totale": 0,
  "condizioni": ["..."]
}
`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.2,
    system:
      "Sei un assistente per preventivi di impianti elettrici/idraulici in Italia. Usa italiano professionale.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlocks = response.content.filter((c) => c.type === "text");
  const text = textBlocks.map((b) => b.text).join("\n").trim();

  return JSON.parse(text);
}
