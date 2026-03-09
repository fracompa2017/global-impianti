export type UserRole = "admin" | "dipendente";

export type StatoCantiere = "pianificato" | "in_corso" | "completato" | "sospeso";

export interface KpiDashboard {
  cantieriAttivi: number;
  dipendentiPresentiOggi: number;
  reportRicevutiOggi: number;
  oreTotaliMese: number;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}
