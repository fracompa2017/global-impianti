import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function defaultFullName(email: string | null | undefined) {
  if (!email) return "Utente";
  return email.split("@")[0]?.replace(/[._-]+/g, " ")?.trim() || "Utente";
}

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  if (existingProfile) {
    return NextResponse.json({ profile: existingProfile, created: false });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Configurazione server incompleta: SUPABASE_SERVICE_ROLE_KEY mancante" },
      { status: 500 }
    );
  }

  const adminEmails = parseAdminEmails();
  const isAdminByEmail = !!user.email && adminEmails.includes(user.email.toLowerCase());

  const payload = {
    id: user.id,
    full_name:
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      defaultFullName(user.email),
    email: user.email ?? null,
    role: (isAdminByEmail ? "admin" : "dipendente") as "admin" | "dipendente",
  };

  const { data: upserted, error: upsertError } = await admin
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, role, full_name, email")
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  return NextResponse.json({ profile: upserted, created: true });
}
