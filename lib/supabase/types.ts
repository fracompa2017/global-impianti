export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: "admin" | "dipendente";
          avatar_url: string | null;
          push_subscription: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: "admin" | "dipendente";
          avatar_url?: string | null;
          push_subscription?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: "admin" | "dipendente";
          avatar_url?: string | null;
          push_subscription?: Json | null;
          created_at?: string;
        };
      };
      cantieri: {
        Row: {
          id: string;
          nome: string;
          cliente: string | null;
          indirizzo: string | null;
          descrizione: string | null;
          stato: "pianificato" | "in_corso" | "completato" | "sospeso" | null;
          data_inizio: string | null;
          data_fine_prevista: string | null;
          data_fine_effettiva: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cliente?: string | null;
          indirizzo?: string | null;
          descrizione?: string | null;
          stato?: "pianificato" | "in_corso" | "completato" | "sospeso" | null;
          data_inizio?: string | null;
          data_fine_prevista?: string | null;
          data_fine_effettiva?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cliente?: string | null;
          indirizzo?: string | null;
          descrizione?: string | null;
          stato?: "pianificato" | "in_corso" | "completato" | "sospeso" | null;
          data_inizio?: string | null;
          data_fine_prevista?: string | null;
          data_fine_effettiva?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      cantiere_assegnazioni: {
        Row: {
          id: string;
          cantiere_id: string | null;
          dipendente_id: string | null;
          data_inizio: string | null;
          data_fine: string | null;
          ruolo_cantiere: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cantiere_id?: string | null;
          dipendente_id?: string | null;
          data_inizio?: string | null;
          data_fine?: string | null;
          ruolo_cantiere?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cantiere_id?: string | null;
          dipendente_id?: string | null;
          data_inizio?: string | null;
          data_fine?: string | null;
          ruolo_cantiere?: string | null;
          created_at?: string;
        };
      };
      turni: {
        Row: {
          id: string;
          dipendente_id: string | null;
          cantiere_id: string | null;
          data: string;
          ora_inizio: string | null;
          ora_fine: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          data: string;
          ora_inizio?: string | null;
          ora_fine?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          data?: string;
          ora_inizio?: string | null;
          ora_fine?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      timbrature: {
        Row: {
          id: string;
          dipendente_id: string | null;
          cantiere_id: string | null;
          data: string;
          ora_entrata: string | null;
          ora_uscita: string | null;
          ore_totali: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          data: string;
          ora_entrata?: string | null;
          ora_uscita?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          data?: string;
          ora_entrata?: string | null;
          ora_uscita?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      report_giornalieri: {
        Row: {
          id: string;
          dipendente_id: string | null;
          cantiere_id: string | null;
          data: string;
          testo: string | null;
          testo_generato_ai: string | null;
          meteo: string | null;
          materiali_utilizzati: string | null;
          problemi_riscontrati: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          data: string;
          testo?: string | null;
          testo_generato_ai?: string | null;
          meteo?: string | null;
          materiali_utilizzati?: string | null;
          problemi_riscontrati?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          data?: string;
          testo?: string | null;
          testo_generato_ai?: string | null;
          meteo?: string | null;
          materiali_utilizzati?: string | null;
          problemi_riscontrati?: string | null;
          created_at?: string;
        };
      };
      report_foto: {
        Row: {
          id: string;
          report_id: string | null;
          url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id?: string | null;
          url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string | null;
          url?: string;
          caption?: string | null;
          created_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          cantiere_id: string | null;
          titolo: string;
          descrizione: string | null;
          data_prevista: string | null;
          data_completamento: string | null;
          completata: boolean;
          percentuale_avanzamento: number;
          created_at: string;
          ordine: number;
        };
        Insert: {
          id?: string;
          cantiere_id?: string | null;
          titolo: string;
          descrizione?: string | null;
          data_prevista?: string | null;
          data_completamento?: string | null;
          completata?: boolean;
          percentuale_avanzamento?: number;
          created_at?: string;
          ordine?: number;
        };
        Update: {
          id?: string;
          cantiere_id?: string | null;
          titolo?: string;
          descrizione?: string | null;
          data_prevista?: string | null;
          data_completamento?: string | null;
          completata?: boolean;
          percentuale_avanzamento?: number;
          created_at?: string;
          ordine?: number;
        };
      };
      documenti: {
        Row: {
          id: string;
          dipendente_id: string | null;
          cantiere_id: string | null;
          tipo: "busta_paga" | "certificato" | "contratto" | "altro" | null;
          nome: string;
          url: string;
          mese: number | null;
          anno: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          tipo?: "busta_paga" | "certificato" | "contratto" | "altro" | null;
          nome: string;
          url: string;
          mese?: number | null;
          anno?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dipendente_id?: string | null;
          cantiere_id?: string | null;
          tipo?: "busta_paga" | "certificato" | "contratto" | "altro" | null;
          nome?: string;
          url?: string;
          mese?: number | null;
          anno?: number | null;
          created_at?: string;
        };
      };
      preventivi: {
        Row: {
          id: string;
          cantiere_id: string | null;
          cliente: string | null;
          titolo: string | null;
          stato: "bozza" | "inviato" | "accettato" | "rifiutato" | null;
          contenuto_ai: Json | null;
          totale: number | null;
          pdf_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cantiere_id?: string | null;
          cliente?: string | null;
          titolo?: string | null;
          stato?: "bozza" | "inviato" | "accettato" | "rifiutato" | null;
          contenuto_ai?: Json | null;
          totale?: number | null;
          pdf_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cantiere_id?: string | null;
          cliente?: string | null;
          titolo?: string | null;
          stato?: "bozza" | "inviato" | "accettato" | "rifiutato" | null;
          contenuto_ai?: Json | null;
          totale?: number | null;
          pdf_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      notifiche: {
        Row: {
          id: string;
          destinatario_id: string | null;
          titolo: string | null;
          messaggio: string | null;
          tipo: string | null;
          letta: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          destinatario_id?: string | null;
          titolo?: string | null;
          messaggio?: string | null;
          tipo?: string | null;
          letta?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          destinatario_id?: string | null;
          titolo?: string | null;
          messaggio?: string | null;
          tipo?: string | null;
          letta?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
