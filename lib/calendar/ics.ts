export interface ICSInterventoInput {
  id: string | number;
  codice: string;
  titoloSegnalazione: string;
  dataIntervento: string; // YYYY-MM-DD
  oraInizio?: string | null; // HH:mm:ss
  oraFine?: string | null; // HH:mm:ss
  location?: string | null;
  descrizioneProblema?: string | null;
  notePianificazione?: string | null;
  appUrl: string;
}

function escapeICS(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toUTCDateTime(date: string, time?: string | null): Date {
  const safeTime = time && time.trim() !== "" ? time : "08:00:00";
  const dt = new Date(`${date}T${safeTime}`);
  if (Number.isNaN(dt.getTime())) {
    return new Date();
  }
  return dt;
}

function toICSDateTime(dt: Date): string {
  return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function resolveEventDateRange(
  date: string,
  oraInizio?: string | null,
  oraFine?: string | null
): { start: string; end: string } {
  const startDate = toUTCDateTime(date, oraInizio);
  const endDate = oraFine ? toUTCDateTime(date, oraFine) : new Date(startDate.getTime() + 60 * 60 * 1000);

  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
  }

  return {
    start: toICSDateTime(startDate),
    end: toICSDateTime(endDate),
  };
}

export function generateICSFile(intervento: ICSInterventoInput): string {
  const summary = `[${intervento.codice}] ${intervento.titoloSegnalazione}`;
  const eventRange = resolveEventDateRange(
    intervento.dataIntervento,
    intervento.oraInizio,
    intervento.oraFine
  );
  const location = intervento.location ?? "";
  const description = [
    intervento.descrizioneProblema ?? "",
    `Note pianificazione: ${intervento.notePianificazione ?? "-"}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const detailUrl = `${intervento.appUrl.replace(/\/$/, "")}/dipendente/interventi/${intervento.id}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Global Impianti//Interventi//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:intervento-${intervento.id}@global-impianti`,
    `DTSTAMP:${toICSDateTime(new Date())}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DTSTART:${eventRange.start}`,
    `DTEND:${eventRange.end}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `URL:${escapeICS(detailUrl)}`,
    "ORGANIZER;CN=Global Impianti:mailto:noreply@globalimpiantick.it",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Promemoria intervento tra 1 ora",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

export function buildGoogleCalendarUrl(intervento: ICSInterventoInput): string {
  const eventRange = resolveEventDateRange(
    intervento.dataIntervento,
    intervento.oraInizio,
    intervento.oraFine
  );
  const text = `[${intervento.codice}] ${intervento.titoloSegnalazione}`;
  const details = [
    intervento.descrizioneProblema ?? "",
    `Note: ${intervento.notePianificazione ?? "-"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const query = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates: `${eventRange.start}/${eventRange.end}`,
    details,
    location: intervento.location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}
