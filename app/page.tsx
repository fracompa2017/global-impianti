"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  HardHat,
  PlusSquare,
  Share,
  Sparkles,
} from "lucide-react";

import { InstallBanner } from "@/components/pwa/InstallBanner";
import { IOSInstructions } from "@/components/pwa/IOSInstructions";
import { usePWAInstall } from "@/components/pwa/usePWAInstall";
import { cardContainerVariants, cardVariants, pageTransition, pageVariants } from "@/lib/animations";
import { createClient } from "@/lib/supabase/client";

type Role = "admin" | "dipendente";

const stepCards = [
  {
    number: "01",
    icon: Share,
    title: "Tocca Condividi",
    text: "Tocca l'icona condivisione nella barra del browser Safari.",
  },
  {
    number: "02",
    icon: PlusSquare,
    title: "Aggiungi a Home",
    text: "Scorri il menu e seleziona Aggiungi alla schermata Home.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Apri e accedi",
    text: "Avvia l'app dalla Home e accedi con il tuo account aziendale.",
  },
];

function getPlatformFlags() {
  if (typeof window === "undefined") {
    return { isAndroidChrome: false };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isAndroidChrome = /android/.test(ua) && /chrome/.test(ua) && !/edg/.test(ua);
  return { isAndroidChrome };
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

      if (!installed) {
        if (active) setReady(true);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role as Role | undefined;
      if (role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }

      router.replace("/dipendente/home");
    };

    void syncEntry();

    return () => {
      active = false;
    };
  }, [isStandalone, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center app-mesh-bg">
        <div className="glass rounded-2xl px-5 py-3 text-sm font-semibold text-[#3B6FE8]">
          Verifica installazione in corso...
        </div>
      </main>
    );
  }

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      router.replace("/auth/login");
    }
    return accepted;
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden app-mesh-bg">
      <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center px-6 pb-10 pt-10 text-center md:pt-16">
        <motion.div
          initial="initial"
          animate="animate"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#BBD0FF] bg-white px-4 py-2 text-xs font-semibold text-[#3B6FE8] shadow-[0_4px_16px_rgba(59,111,232,0.1)]">
            <Sparkles className="h-3.5 w-3.5" />
            Versione 1.0 · Accesso Riservato
          </div>

          <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] text-white shadow-[0_10px_30px_rgba(59,111,232,0.3)]">
            <HardHat className="h-7 w-7" />
          </div>

          <h1 className="mx-auto mt-5 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-[-0.04em] text-[#0A0C14]">
            Il tuo cantiere,
            <br />
            sempre con te.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-[#4A5068]">
            Accedi alla piattaforma Global Impianti per gestire cantieri, segnalazioni e il tuo
            team in tempo reale.
          </p>
        </motion.div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={cardContainerVariants}
          className="relative mt-10 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3"
        >
          {["-rotate-6", "rotate-0", "rotate-6"].map((rotation, index) => (
            <motion.div
              key={rotation}
              variants={cardVariants}
              className={`relative mx-auto w-full max-w-[270px] ${rotation}`}
            >
              <div className="rounded-[32px] border border-[#1F2937] bg-[#111827] p-2 shadow-[0_20px_45px_rgba(15,23,42,0.3)]">
                <div className="rounded-[26px] bg-[linear-gradient(160deg,#EEF3FF_0%,#F5EDFF_50%,#FFF1EB_100%)] p-4">
                  <div className="mb-3 mx-auto h-1.5 w-16 rounded-full bg-[#111827]/20" />
                  <div className="space-y-2">
                    <div className="rounded-xl bg-white/90 p-3 shadow-sm">
                      <p className="text-xs font-semibold text-[#4A5068]">Intervento assegnato</p>
                      <p className="text-sm font-bold text-[#0A0C14]">SEG-2026-00{index + 1}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs text-[#4A5068]">Tecnico on-site</p>
                      <p className="text-sm font-semibold text-[#0A0C14]">Via Roma {index + 18}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs text-[#4A5068]">Stato</p>
                      <p className="text-sm font-semibold text-[#3B6FE8]">In lavorazione</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="floating-tag absolute -left-2 top-1/2 hidden -translate-y-16 rounded-full border border-[#E8EAF0] bg-white px-4 py-2 text-sm font-medium text-[#0A0C14] shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:block">
            📍 Cantiere Via Roma
          </div>
          <div className="floating-tag absolute -right-4 top-3 hidden rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-sm font-medium text-[#059669] shadow-[0_10px_30px_rgba(16,185,129,0.15)] md:block">
            ✅ Timbratura salvata
          </div>
          <div className="floating-tag absolute bottom-0 right-8 hidden rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2 text-sm font-medium text-[#2563EB] shadow-[0_10px_30px_rgba(59,130,246,0.2)] md:block">
            🔔 Nuovo intervento
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={pageVariants}
          transition={pageTransition}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">
            Installa l'app in 3 secondi
          </h2>
          <p className="mt-2 text-[#4A5068]">
            Nessuno store. Nessun download. Funziona su iPhone e Android.
          </p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={cardContainerVariants}
          className="grid gap-4 md:grid-cols-3"
        >
          {stepCards.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.number}
                variants={cardVariants}
                className="relative rounded-3xl border border-[#E8EAF0] bg-white p-6 shadow-[0_6px_22px_rgba(15,23,42,0.05)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#EEF3FF_0%,#F0EBFF_100%)] text-[#3B6FE8]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mb-2 text-xs font-bold tracking-[0.12em] text-[#6B4FE8]">{step.number}</p>
                <h3 className="text-lg font-bold text-[#0A0C14]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#4A5068]">{step.text}</p>

                {idx < stepCards.length - 1 ? (
                  <span className="pointer-events-none absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-[#E8EAF0] bg-white text-center text-sm leading-6 text-[#3B6FE8] md:block">
                    →
                  </span>
                ) : null}
              </motion.article>
            );
          })}
        </motion.div>

        <div className="mt-10 flex justify-center text-center text-xs text-[#9199B1]">
          <p>L'accesso e disponibile dopo installazione PWA.</p>
        </div>
      </section>

      <footer className="pb-24 text-center text-xs text-[#9199B1] md:pb-8">
        <p>© 2025 Global Impianti · Accesso riservato al personale autorizzato</p>
        <p className="mt-1">Sviluppato con cura in Italia</p>
      </footer>

      <InstallBanner open={platform.isAndroidChrome && canInstall && !isStandalone} onInstall={handleInstall} />
      <IOSInstructions open={isIOS && !isStandalone} />
    </main>
  );
}
