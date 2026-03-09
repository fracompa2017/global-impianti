"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, PlusSquare, Share, Zap } from "lucide-react";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { IOSInstructions } from "@/components/pwa/IOSInstructions";
import { usePWAInstall } from "@/components/pwa/usePWAInstall";
import { createClient } from "@/lib/supabase/client";

type Role = "admin" | "dipendente";

const steps = [
  { n: "01", icon: Share,        title: "Tocca Condividi",   text: "Tocca l'icona condivisione nella barra di Safari." },
  { n: "02", icon: PlusSquare,   title: "Aggiungi a Home",   text: "Scorri e seleziona «Aggiungi alla schermata Home»." },
  { n: "03", icon: CheckCircle2, title: "Apri e accedi",     text: "Avvia l'app dalla Home e accedi con il tuo account." },
];

function getPlatformFlags() {
  if (typeof window === "undefined") return { isAndroidChrome: false };
  const ua = window.navigator.userAgent.toLowerCase();
  return { isAndroidChrome: /android/.test(ua) && /chrome/.test(ua) && !/edg/.test(ua) };
}

export default function LandingPage() {
  const router = useRouter();
  const { isIOS, isStandalone, canInstall, promptInstall } = usePWAInstall();
  const [ready, setReady] = useState(false);
  const platform = useMemo(() => getPlatformFlags(), []);

  useEffect(() => {
    let active = true;
    const syncEntry = async () => {
      const hasCookie = document.cookie.includes("pwa-installed=true");
      const installed = isStandalone || hasCookie;
      if (isStandalone) {
        document.cookie = "pwa-installed=true; path=/; max-age=31536000; samesite=lax";
      }
      if (!installed) { if (active) setReady(true); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      router.replace(profile?.role === "admin" ? "/admin/dashboard" : "/dipendente/home");
    };
    void syncEntry();
    return () => { active = false; };
  }, [isStandalone, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center app-mesh-bg">
        <div className="rounded-[20px] px-6 py-4 text-sm font-bold text-[#2B5CE6]"
          style={{ background: "white", boxShadow: "0 4px 24px rgba(12,26,58,0.10)" }}>
          Verifica installazione...
        </div>
      </main>
    );
  }

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) router.replace("/auth/login");
    return accepted;
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden" style={{ background: "#F2EFE9" }}>
      {/* Mesh gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle,#2B5CE6,transparent)" }} />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle,#F97316,transparent)" }} />
      </div>

      {/* ── HERO ── */}
      <section className="relative mx-auto flex min-h-[62vh] max-w-6xl flex-col items-center px-6 pb-12 pt-12 text-center md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-[#2B5CE6]"
            style={{ background: "white", boxShadow: "0 2px 12px rgba(12,26,58,0.09)", border: "1px solid #D6E3FF" }}>
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            Versione 1.0 · Accesso Riservato
          </div>

          {/* Logo icon */}
          <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-[22px]"
            style={{
              background: "linear-gradient(135deg,#2B5CE6,#4A78F5)",
              boxShadow: "0 12px 36px rgba(43,92,230,0.35), 0 4px 12px rgba(43,92,230,0.22)",
            }}>
            <Zap className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>

          <h1 className="mx-auto max-w-3xl text-[clamp(2.2rem,5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#0C1117]">
            Il tuo cantiere,<br />
            <span style={{
              background: "linear-gradient(135deg,#2B5CE6,#4A78F5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>sempre con te.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-lg font-medium leading-relaxed text-[#475569]">
            Accedi alla piattaforma Global Impianti per gestire cantieri,<br className="hidden sm:block" />
            segnalazioni e il tuo team in tempo reale.
          </p>
        </motion.div>

        {/* Phone mockups */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-12 flex w-full max-w-2xl items-end justify-center gap-4"
        >
          {["-rotate-6 scale-90 opacity-75", "scale-100 z-10", "rotate-6 scale-90 opacity-75"].map((cls, i) => (
            <div key={i} className={`relative ${cls}`}>
              <div className="rounded-[28px] p-2"
                style={{ background: "#1C1C1E", boxShadow: "0 24px 60px rgba(12,26,58,0.35)" }}>
                <div className="rounded-[22px] p-4"
                  style={{ background: "linear-gradient(160deg,#0C1A3A,#1C3060)", minWidth: 160, minHeight: 280 }}>
                  <div className="mx-auto mb-3 h-1.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                  <div className="space-y-2.5">
                    {[
                      { label: "Cantiere", val: `Via Roma ${18 + i}`, color: "#4A78F5" },
                      { label: "Stato",    val: "In corso",            color: "#22C55E" },
                      { label: "Tecnico",  val: `SEG-2026-00${i + 1}`, color: "#FB923C" },
                    ].map((row) => (
                      <div key={row.label} className="rounded-[14px] p-2.5"
                        style={{ background: "rgba(255,255,255,0.08)" }}>
                        <p className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{row.label}</p>
                        <p className="text-xs font-bold" style={{ color: row.color }}>{row.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Floating tags */}
          <div className="floating-tag absolute -left-4 top-1/3 hidden rounded-full px-4 py-2 text-sm font-semibold md:block"
            style={{ background: "white", boxShadow: "0 8px 24px rgba(12,26,58,0.12)", color: "#0C1117", animationDelay: "0ms" }}>
            📍 Cantiere Via Roma
          </div>
          <div className="floating-tag absolute -right-6 top-6 hidden rounded-full px-4 py-2 text-sm font-semibold text-[#15803D] md:block"
            style={{ background: "#F0FDF4", border: "1px solid #A7F3D0", boxShadow: "0 8px 24px rgba(34,197,94,0.15)", animationDelay: "200ms" }}>
            ✅ Presenza confermata
          </div>
          <div className="floating-tag absolute bottom-4 right-4 hidden rounded-full px-4 py-2 text-sm font-semibold text-[#2563EB] md:block"
            style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", boxShadow: "0 8px 24px rgba(59,130,246,0.18)", animationDelay: "400ms" }}>
            🔔 Nuovo intervento
          </div>
        </motion.div>
      </section>

      {/* ── STEPS ── */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-[1.875rem] font-extrabold tracking-[-0.035em] text-[#0C1117]">
            Installa in 3 secondi
          </h2>
          <p className="mt-2 font-medium text-[#475569]">
            Nessuno store. Nessun download. Funziona su iPhone e Android.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-[24px] p-6"
                style={{ background: "white", boxShadow: "0 4px 16px rgba(12,26,58,0.08), 0 1px 4px rgba(12,26,58,0.04)" }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px]"
                  style={{ background: "linear-gradient(135deg,#EBF1FF,#E0EBFF)" }}>
                  <Icon className="h-5 w-5 text-[#2B5CE6]" strokeWidth={2} />
                </div>
                <p className="mb-1.5 text-xs font-extrabold tracking-[0.1em] text-[#2B5CE6]">STEP {step.n}</p>
                <h3 className="text-lg font-extrabold tracking-[-0.025em] text-[#0C1117]">{step.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#475569]">{step.text}</p>
                {idx < steps.length - 1 && (
                  <span className="pointer-events-none absolute -right-3 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-sm font-bold text-[#2B5CE6] md:flex"
                    style={{ background: "white", boxShadow: "0 2px 8px rgba(12,26,58,0.10)" }}>
                    →
                  </span>
                )}
              </motion.article>
            );
          })}
        </div>
      </section>

      <footer className="pb-24 text-center text-xs font-medium text-[#94A3B8] md:pb-10">
        <p>© 2025 Global Impianti · Accesso riservato al personale autorizzato</p>
        <p className="mt-1">Sviluppato con cura in Italia 🇮🇹</p>
      </footer>

      <InstallBanner open={platform.isAndroidChrome && canInstall && !isStandalone} onInstall={handleInstall} />
      <IOSInstructions open={isIOS && !isStandalone} />
    </main>
  );
}
