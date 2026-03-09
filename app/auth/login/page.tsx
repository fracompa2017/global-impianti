"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageTransition, pageVariants } from "@/lib/animations";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email:    z.string().email("Inserisci una email valida"),
  password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
});
type LoginInput = z.infer<typeof loginSchema>;

const features = ["Cantieri in tempo reale", "Segnalazioni e guasti", "Report con AI"];
const stats = [
  { label: "Stato live",    value: "5 cantieri attivi" },
  { label: "Team",          value: "12 dipendenti" },
  { label: "Attività oggi", value: "3 report ricevuti" },
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (authError || !data.user) {
      const mappedMessage =
        authError?.message?.toLowerCase().includes("invalid login credentials")
          ? "Email o password non corretti"
          : authError?.message ?? "Credenziali non valide";
      setError(mappedMessage);
      return;
    }

    let role: "admin" | "dipendente" | null = null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    role = (profile?.role as "admin" | "dipendente" | undefined) ?? null;

    if (!role) {
      const syncResponse = await fetch("/api/auth/sync-profile", {
        method: "POST",
      });

      const syncPayload = (await syncResponse.json().catch(() => ({}))) as {
        profile?: { role?: "admin" | "dipendente" };
        error?: string;
      };

      if (!syncResponse.ok || !syncPayload.profile?.role) {
        setError(
          syncPayload.error ??
            "Profilo utente mancante. Contatta l'amministratore per completare l'accesso."
        );
        return;
      }

      role = syncPayload.profile.role;
    }

    router.replace(role === "admin" ? "/admin/dashboard" : "/dipendente/home");
  };

  return (
    <main className="grid min-h-screen" style={{ background: "#F2EFE9" }}>
      <div className="grid lg:grid-cols-[45%_55%]">

        {/* ── LEFT PANEL (desktop) ── */}
        <section
          className="relative hidden overflow-hidden lg:flex"
          style={{ background: "linear-gradient(160deg,#0C1A3A 0%,#142448 55%,#1C3060 100%)" }}
        >
          {/* bg blobs */}
          <div className="pointer-events-none absolute -top-16 right-0 h-80 w-80 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#4A78F5,transparent)" }} />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-64 w-64 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle,#F97316,transparent)" }} />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 text-white">
            <div>
              {/* Logo */}
              <div className="mb-12 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                  style={{ background: "linear-gradient(135deg,#2B5CE6,#4A78F5)", boxShadow: "0 8px 24px rgba(43,92,230,0.40)" }}>
                  <Zap className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-base font-extrabold tracking-[-0.02em]">Global Impianti</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Gestionale aziendale</p>
                </div>
              </div>

              <h1 className="max-w-xs text-4xl font-extrabold leading-[1.15] tracking-[-0.04em]">
                Gestisci il tuo team,<br />
                <span style={{ color: "rgba(255,255,255,0.7)" }}>ovunque tu sia.</span>
              </h1>

              <div className="mt-8 space-y-2.5">
                {features.map((f) => (
                  <div key={f}
                    className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-semibold"
                    style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)" }}>
                    <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "#4A78F5" }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3">
              {stats.map((s, i) => (
                <div key={s.label}
                  className="floating-tag rounded-[18px] px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.13)",
                    animationDelay: `${i * 180}ms`,
                  }}>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</p>
                  <p className="text-lg font-extrabold tracking-[-0.03em]">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RIGHT PANEL ── */}
        <section
          className="flex items-center justify-center px-6 py-12 sm:px-10"
          style={{ background: "#F2EFE9" }}
        >
          <motion.div
            initial="initial" animate="animate"
            variants={pageVariants} transition={pageTransition}
            className="w-full max-w-[420px]"
          >
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px]"
                style={{ background: "linear-gradient(135deg,#2B5CE6,#4A78F5)", boxShadow: "0 6px 18px rgba(43,92,230,0.35)" }}>
                <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-base font-extrabold tracking-[-0.02em] text-[#0C1117]">Global Impianti</span>
            </div>

            {/* Form card */}
            <div className="rounded-[28px] p-8"
              style={{ background: "#FFFFFF", boxShadow: "0 8px 40px rgba(12,26,58,0.11), 0 2px 8px rgba(12,26,58,0.06)" }}>
              <h2 className="text-[1.875rem] font-extrabold tracking-[-0.035em] text-[#0C1117]">
                Bentornato 👋
              </h2>
              <p className="mt-1.5 text-sm font-medium text-[#475569]">Accedi al tuo account aziendale</p>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-bold text-[#475569]">Email</Label>
                  <Input id="email" type="email" placeholder="nome@globalimpianti.it" {...register("email")} />
                  {errors.email && <p className="text-xs font-medium text-[#EF4444]">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-bold text-[#475569]">Password</Label>
                    <button type="button" className="text-xs font-semibold text-[#2B5CE6] hover:underline">
                      Password dimenticata?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-medium text-[#EF4444]">{errors.password.message}</p>}
                </div>

                {error && (
                  <div className="rounded-[12px] px-4 py-3 text-sm font-medium text-[#DC2626]"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                    {error}
                  </div>
                )}

                <Button type="submit" className="mt-2 w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Accesso in corso...</>
                  ) : (
                    "Accedi →"
                  )}
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-[#94A3B8]">
              Problemi di accesso? Contatta l&apos;amministratore.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
