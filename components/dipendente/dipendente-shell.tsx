"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarFold,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  MapPin,
  UserCircle2,
  Wrench,
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
  { href: "/dipendente/home", label: "Casa", icon: Home },
  { href: "/dipendente/cantieri", label: "Cantieri", icon: FolderKanban },
  { href: "/dipendente/report", label: "Report", icon: FileText },
  { href: "/dipendente/interventi", label: "Interventi", icon: Wrench },
  { href: "/dipendente/documenti", label: "Documenti", icon: CalendarFold },
];

export function DipendenteShell({ pathname, userName, children }: DipendenteShellProps) {
  const todayLabel = format(new Date(), "EEEE d MMMM", { locale: it });

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0A0C14]">
      <header className="relative overflow-hidden rounded-b-[28px] bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] px-6 pb-10 pt-12 text-white shadow-[0_14px_34px_rgba(59,111,232,0.35)] md:px-8">
        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tracking-[-0.03em]">Ciao, {userName.split(" ")[0]} 👋</p>
            <p className="mt-1 text-sm text-white/80">{todayLabel}</p>
          </div>
          <UserCircle2 className="h-10 w-10 text-white/90" />
        </div>
      </header>

      <div className="relative z-20 -mt-6 px-6 md:px-8">
        <div className="rounded-[20px] border border-[#E8EAF0] bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,0.09)]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9199B1]">Cantiere di oggi</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#0A0C14]">
            <MapPin className="h-4 w-4 text-[#3B6FE8]" />
            Pianificazione operativa in corso
          </div>
        </div>
      </div>

      <motion.main
        key={pathname}
        initial="initial"
        animate="animate"
        variants={pageVariants}
        transition={pageTransition}
        className="px-6 pb-28 pt-6 md:px-8"
      >
        {children}
      </motion.main>

      <nav className="bottom-safe fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(232,234,240,0.8)] bg-[rgba(255,255,255,0.86)] backdrop-blur-xl">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 px-2 py-3 text-[11px] font-medium text-[#7C839D] transition-colors",
                    active && "text-[#3B6FE8]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {active ? (
                    <span className="mt-1 h-1 w-1 rounded-full bg-[#3B6FE8] shadow-[0_0_8px_rgba(59,111,232,0.6)]" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        href="/auth/logout"
        className="fixed right-5 top-5 z-50 hidden items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#4A5068] shadow-sm md:inline-flex"
      >
        <LogOut className="h-3.5 w-3.5" />
        Logout
      </Link>
    </div>
  );
}
