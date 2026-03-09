"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarFold,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  Wrench,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { pageTransition, pageVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

type DipendenteShellProps = {
  pathname: string;
  userName: string;
  children: ReactNode;
};

const links = [
  { href: "/dipendente/home",       label: "Home",       icon: Home },
  { href: "/dipendente/cantieri",   label: "Cantieri",   icon: FolderKanban },
  { href: "/dipendente/report",     label: "Report",     icon: FileText },
  { href: "/dipendente/interventi", label: "Interventi", icon: Wrench },
  { href: "/dipendente/documenti",  label: "Documenti",  icon: CalendarFold },
];

export function DipendenteShell({ pathname, userName, children }: DipendenteShellProps) {
  const todayLabel = format(new Date(), "EEEE d MMMM", { locale: it });
  const firstName = userName.split(" ")[0];
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* ── HEADER ── */}
      <header
        className="relative overflow-hidden px-6 pb-10 pt-14 text-white md:px-8"
        style={{ background: "var(--grad-navy, linear-gradient(160deg,#0C1A3A 0%,#142448 55%,#1C3060 100%))", borderRadius: "0 0 32px 32px" }}
      >
        {/* Background blobs */}
        <div className="pointer-events-none absolute -right-12 -top-8 h-48 w-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4A78F5, transparent)" }} />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }} />

        <div className="relative z-10 flex items-start justify-between gap-3">
          {/* Logo + greeting */}
          <div>
            {/* Logo */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                style={{ background: "linear-gradient(135deg,#2B5CE6,#4A78F5)" }}>
                <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold tracking-[-0.02em] text-white/90">Global Impianti</span>
            </div>
            <p className="text-[1.625rem] font-extrabold leading-tight tracking-[-0.03em]">
              Ciao, {firstName} 👋
            </p>
            <p className="mt-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
            </p>
          </div>

          {/* Avatar */}
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] text-sm font-extrabold text-white"
            style={{
              background: "linear-gradient(135deg,#4A78F5,#6B4FE8)",
              border: "2.5px solid rgba(255,255,255,0.25)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
            }}>
            {initials}
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <motion.main
        key={pathname}
        initial="initial"
        animate="animate"
        variants={pageVariants}
        transition={pageTransition}
        className="px-5 pb-32 pt-5 md:px-6"
      >
        {children}
      </motion.main>

      {/* ── DOCK BAR ── */}
      <nav
        className="bottom-safe fixed inset-x-0 bottom-0 z-40"
        style={{
          background: "rgba(249,247,244,0.88)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "0 -4px 24px rgba(12,26,58,0.08), 0 -1px 0 rgba(195,189,180,0.4)",
        }}
      >
        {/* Inner pill */}
        <div
          className="mx-4 my-2 flex items-center justify-around rounded-[24px] px-1 py-1"
          style={{ background: "#FFFFFF", boxShadow: "0 2px 12px rgba(12,26,58,0.08)" }}
        >
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] py-2.5 px-1 text-[10px] font-bold tracking-[0.02em] transition-all duration-200",
                  active
                    ? "text-[#2B5CE6]"
                    : "text-[#94A3B8] hover:text-[#475569]"
                )}
                style={active ? { background: "linear-gradient(135deg,#EBF1FF,#E0EBFF)" } : {}}
              >
                <Icon
                  className={cn("h-5 w-5 transition-all duration-200", active ? "scale-110" : "")}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {item.label}
                {active && <span className="nav-glow-dot" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop logout */}
      <Link
        href="/auth/logout"
        className="fixed right-5 top-5 z-50 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#475569] shadow-sm hover:bg-white md:inline-flex"
      >
        <LogOut className="h-3.5 w-3.5" />
        Logout
      </Link>
    </div>
  );
}
