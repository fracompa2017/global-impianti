import { format, startOfMonth, endOfMonth } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

export async function getAdminDashboardData() {
  const supabase = await createClient();

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const [{ count: cantieriAttivi = 0 }, { count: dipendentiPresentiOggi = 0 }, { count: reportRicevutiOggi = 0 }] = await Promise.all([
    supabase.from("cantieri").select("*", { count: "exact", head: true }).eq("stato", "in_corso"),
    supabase
      .from("timbrature")
      .select("*", { count: "exact", head: true })
      .eq("data", today)
      .not("ora_entrata", "is", null),
    supabase
      .from("report_giornalieri")
      .select("*", { count: "exact", head: true })
      .eq("data", today),
  ]);

  const { data: oreRows } = await supabase
    .from("timbrature")
    .select("ore_totali")
    .gte("data", monthStart)
    .lte("data", monthEnd);

  const oreTotaliMese = (oreRows ?? []).reduce(
    (acc, row) => acc + Number(row.ore_totali ?? 0),
    0
  );

  const { data: cantieriInCorso } = await supabase
    .from("cantieri")
    .select("id, nome, cliente, stato, data_fine_prevista")
    .eq("stato", "in_corso")
    .order("created_at", { ascending: false })
    .limit(8);

  const cantiereIds = (cantieriInCorso ?? []).map((c) => c.id);
  const milestones = cantiereIds.length
    ? (
        await supabase
          .from("milestones")
          .select("cantiere_id, completata")
          .in("cantiere_id", cantiereIds)
      ).data
    : [];

  const progressByCantiere = new Map<string, number>();
  (cantieriInCorso ?? []).forEach((cantiere) => {
    const current = (milestones ?? []).filter((m) => m.cantiere_id === cantiere.id);
    if (!current.length) {
      progressByCantiere.set(cantiere.id, 0);
      return;
    }

    const done = current.filter((m) => m.completata).length;
    progressByCantiere.set(cantiere.id, Math.round((done / current.length) * 100));
  });

  const { data: recentReports } = await supabase
    .from("report_giornalieri")
    .select(
      "id, data, testo, created_at, cantiere_id, dipendente_id, cantieri(nome), profiles(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: turniSettimanali } = await supabase
    .from("turni")
    .select("id, data, ora_inizio, ora_fine, cantiere_id, dipendente_id, cantieri(nome), profiles(full_name)")
    .order("data", { ascending: true })
    .limit(30);

  return {
    kpi: {
      cantieriAttivi,
      dipendentiPresentiOggi,
      reportRicevutiOggi,
      oreTotaliMese: Number(oreTotaliMese.toFixed(1)),
    },
    cantieriInCorso: (cantieriInCorso ?? []).map((c) => ({
      ...c,
      avanzamento: progressByCantiere.get(c.id) ?? 0,
    })),
    recentReports: recentReports ?? [],
    turniSettimanali: turniSettimanali ?? [],
  };
}

export async function getTeamRows() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: dipendenti } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role")
    .eq("role", "dipendente")
    .order("full_name", { ascending: true });

  const ids = (dipendenti ?? []).map((d) => d.id);
  if (!ids.length) {
    return [];
  }

  const [{ data: assegnazioni }, { data: presenza }, { data: timbratureMese }, { data: documenti }] =
    await Promise.all([
    supabase
      .from("cantiere_assegnazioni")
      .select("dipendente_id, ruolo_cantiere, cantiere_id, cantieri(nome)")
      .in("dipendente_id", ids),
    supabase
      .from("timbrature")
      .select("dipendente_id, ora_entrata")
      .eq("data", today)
      .in("dipendente_id", ids)
      .not("ora_entrata", "is", null),
    supabase
      .from("timbrature")
      .select("dipendente_id, ore_totali, data")
      .in("dipendente_id", ids)
      .gte("data", monthStart)
      .lte("data", monthEnd),
    supabase.from("documenti").select("id, dipendente_id").in("dipendente_id", ids),
  ]);

  return (dipendenti ?? []).map((d) => {
    const assRows = (assegnazioni ?? []).filter((a) => a.dipendente_id === d.id);
    const dipAss = assRows[0];
    const isPresente = (presenza ?? []).some((p) => p.dipendente_id === d.id);
    const oreMese = (timbratureMese ?? [])
      .filter((row) => row.dipendente_id === d.id)
      .reduce((acc, row) => acc + Number(row.ore_totali ?? 0), 0);
    const timbratureCount = (timbratureMese ?? []).filter(
      (row) => row.dipendente_id === d.id
    ).length;
    const documentiCount = (documenti ?? []).filter(
      (row) => row.dipendente_id === d.id
    ).length;
    const cantieri = Array.from(
      new Set(
        assRows
          .map((row) => (row as any).cantieri?.nome)
          .filter((value): value is string => !!value)
      )
    );

    return {
      id: d.id,
      nome: d.full_name ?? "N/D",
      email: d.email ?? "",
      telefono: d.phone ?? "",
      ruoloCantiere: dipAss?.ruolo_cantiere ?? "Non assegnato",
      cantiere: (dipAss as any)?.cantieri?.nome ?? "-",
      stato: isPresente ? "presente" : "assente",
      oreMese: Number(oreMese.toFixed(1)),
      cantieri,
      documentiCount,
      timbratureCount,
    };
  });
}

export async function getCantieriList(stato?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("cantieri")
    .select("id, nome, cliente, stato, data_fine_prevista, created_at")
    .order("created_at", { ascending: false });

  if (stato && stato !== "tutti") {
    query = query.eq("stato", stato as any);
  }

  const { data: cantieri } = await query;
  const ids = (cantieri ?? []).map((c) => c.id);

  if (!ids.length) {
    return [];
  }

  const [{ data: milestones }, { data: ass }] = await Promise.all([
    supabase.from("milestones").select("cantiere_id, completata").in("cantiere_id", ids),
    supabase.from("cantiere_assegnazioni").select("cantiere_id").in("cantiere_id", ids),
  ]);

  return (cantieri ?? []).map((cantiere) => {
    const currentMilestones = (milestones ?? []).filter(
      (m) => m.cantiere_id === cantiere.id
    );
    const completed = currentMilestones.filter((m) => m.completata).length;

    const avanzamento = currentMilestones.length
      ? Math.round((completed / currentMilestones.length) * 100)
      : 0;

    const dipendentiCount = (ass ?? []).filter((a) => a.cantiere_id === cantiere.id)
      .length;

    return {
      ...cantiere,
      avanzamento,
      dipendentiCount,
    };
  });
}

export async function getCantiereDetails(id: string) {
  const supabase = await createClient();

  const [{ data: cantiere }, { data: assegnati }, { data: milestones }, { data: reports }] =
    await Promise.all([
      supabase.from("cantieri").select("*").eq("id", id).single(),
      supabase
        .from("cantiere_assegnazioni")
        .select("id, ruolo_cantiere, data_inizio, data_fine, dipendente_id, profiles(full_name, email)")
        .eq("cantiere_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("milestones")
        .select("*")
        .eq("cantiere_id", id)
        .order("ordine", { ascending: true }),
      supabase
        .from("report_giornalieri")
        .select("id, data, testo, meteo, materiali_utilizzati, problemi_riscontrati, profiles(full_name)")
        .eq("cantiere_id", id)
        .order("data", { ascending: false })
        .limit(30),
    ]);

  return {
    cantiere: cantiere ?? null,
    assegnati: assegnati ?? [],
    milestones: milestones ?? [],
    reports: reports ?? [],
  };
}

export async function getDipendenteHomeData(userId: string) {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: turni }, { data: timbrature }, { data: reportOggi }, { data: documenti }] =
    await Promise.all([
      supabase
        .from("turni")
        .select("id, data, ora_inizio, ora_fine, note, cantieri(nome)")
        .eq("dipendente_id", userId)
        .gte("data", today)
        .order("data", { ascending: true })
        .limit(10),
      supabase
        .from("timbrature")
        .select("*")
        .eq("dipendente_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("report_giornalieri")
        .select("id")
        .eq("dipendente_id", userId)
        .eq("data", today)
        .maybeSingle(),
      supabase
        .from("documenti")
        .select("id, nome, tipo, mese, anno, url, created_at")
        .eq("dipendente_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  return {
    turni: turni ?? [],
    timbrature: timbrature ?? [],
    reportInviatoOggi: !!reportOggi,
    documenti: documenti ?? [],
  };
}
