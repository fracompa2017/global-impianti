"use client";

import { useState } from "react";
import { Eye, EyeOff, HardHat, Loader2, ShieldCheck } from "lucide-react";
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
  email: z.string().email("Inserisci una email valida"),
  password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
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
      setError(authError?.message ?? "Credenziali non valide");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("Profilo utente non trovato. Contatta l'amministratore.");
      return;
    }

    if (profile.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }

    router.replace("/dipendente/home");
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[45%_55%]">
      <section className="relative hidden overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#0F1629_0%,#1E2D5E_50%,#2D1B6E_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(107,79,232,0.26),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(59,111,232,0.3),transparent_50%)]" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 text-white">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#2D5ED4]">
                <HardHat className="h-4 w-4" />
              </span>
              <span className="text-base font-bold tracking-[-0.02em]">Global Impianti</span>
            </div>

            <h1 className="mt-12 max-w-md text-4xl font-extrabold tracking-[-0.04em]">
              Gestisci il tuo team,
              <br />
              ovunque tu sia.
            </h1>

            <div className="mt-8 space-y-3 text-sm">
              {[
                "Cantieri in tempo reale",
                "Segnalazioni e guasti",
                "Report con AI",
              ].map((item) => (
                <div
                  key={item}
                  className="glass inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="floating-tag rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl">
              <p className="text-xs text-white/70">Stato live</p>
              <p className="text-lg font-bold">5 cantieri attivi</p>
            </div>
            <div className="floating-tag rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl [animation-delay:200ms]">
              <p className="text-xs text-white/70">Team</p>
              <p className="text-lg font-bold">12 dipendenti</p>
            </div>
            <div className="floating-tag rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl [animation-delay:400ms]">
              <p className="text-xs text-white/70">Attivita oggi</p>
              <p className="text-lg font-bold">3 report ricevuti</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E8EAF0] bg-white px-3 py-2 shadow-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] text-white">
                <HardHat className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold tracking-[-0.01em] text-[#0A0C14]">Global Impianti</span>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">Bentornato</h2>
          <p className="mt-2 text-sm text-[#4A5068]">Accedi al tuo account</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nome@azienda.it" {...register("email")} />
              {errors.email ? <p className="text-xs text-[#DC2626]">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-[#3B6FE8] hover:underline">
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
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9199B1] hover:text-[#4A5068]"
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-xs text-[#DC2626]">{errors.password.message}</p> : null}
            </div>

            {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>

          <p className="mt-8 text-xs text-[#9199B1]">
            Problemi di accesso? Contatta l'amministratore.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
