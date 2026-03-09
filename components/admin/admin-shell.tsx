"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { pageTransition, pageVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "PRINCIPALE",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/cantieri", label: "Cantieri", icon: Building2 },
      { href: "/admin/team", label: "Team", icon: Users },
    ],
  },
  {
    title: "OPERATIVO",
    items: [
      { href: "/admin/turni", label: "Turni", icon: CalendarDays, disabled: true },
      { href: "/admin/presenze", label: "Presenze", icon: UserCheck, disabled: true },
      { href: "/admin/report-interventi", label: "Report", icon: FileText, disabled: true },
      { href: "/admin/segnalazioni", label: "Segnalazioni", icon: ShieldAlert, disabled: true },
    ],
  },
  {
    title: "DOCUMENTI",
    items: [
      { href: "/admin/documenti", label: "Documenti", icon: FileText, disabled: true },
      { href: "/admin/preventivi", label: "Preventivi AI", icon: Wrench, disabled: true },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings, disabled: true },
      { href: "/auth/logout", label: "Logout", icon: LogOut },
    ],
  },
];

function getBreadcrumb(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  if (segments.length === 0) return "Dashboard";
  return segments
    .map((item) => item.replace(/-/g, " "))
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" / ");
}

export function AdminShell({ pathname, collapsed, onToggle, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0A0C14]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-[#E8EAF0] bg-white transition-all duration-200 lg:flex lg:flex-col",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <div className="border-b border-[#F0F2F7] p-5">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}> 
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(59,111,232,0.35)]">
              GI
            </span>
            {!collapsed ? (
              <div>
                <p className="text-sm font-bold tracking-[-0.02em]">Global Impianti</p>
                <span className="rounded-full border border-[#DCE8FF] bg-[#EEF3FF] px-2 py-0.5 text-[10px] font-semibold text-[#3B6FE8]">
                  Admin
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed ? (
                <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.1em] text-[#9199B1]">{section.title}</p>
              ) : null}

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = !item.disabled && pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.disabled ? pathname : item.href}
                      className={cn(
                        "group relative mx-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        item.disabled
                          ? "cursor-not-allowed text-[#B2B8CB]"
                          : active
                            ? "bg-[linear-gradient(135deg,#EEF3FF_0%,#F0EBFF_100%)] font-semibold text-[#3B6FE8]"
                            : "text-[#4A5068] hover:bg-[#F8F9FC] hover:text-[#0A0C14]",
                        collapsed && "justify-center"
                      )}
                    >
                      {active ? (
                        <span className="absolute -left-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#3B6FE8_0%,#6B4FE8_100%)]" />
                      ) : null}
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-3">
          {!collapsed ? (
            <div className="glass rounded-2xl p-3 text-xs text-[#4A5068]">
              <p className="font-semibold text-[#0A0C14]">Global Impianti</p>
              <p className="mt-1">Piano Enterprise · v1.0</p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="icon"
            onClick={onToggle}
            className={cn("mt-2 w-full", collapsed && "h-9 w-9 mx-auto")}
            aria-label={collapsed ? "Espandi sidebar" : "Collassa sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <div className={cn("transition-all duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]")}> 
        <header className="sticky top-0 z-30 border-b border-[rgba(232,234,240,0.8)] bg-[rgba(255,255,255,0.85)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0A0C14]">{getBreadcrumb(pathname)}</p>
            </div>

            <div className="hidden min-w-[280px] flex-1 lg:block">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9199B1]" />
                <input
                  type="search"
                  placeholder="Cerca cantieri, dipendenti, segnalazioni..."
                  className="h-10 w-full rounded-xl border-[1.5px] border-[#E8EAF0] bg-[#F8F9FC] pl-9 pr-3 text-sm outline-none transition-all focus:border-[#3B6FE8] focus:bg-white focus:ring-4 focus:ring-[rgba(59,111,232,0.1)]"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="icon" size="icon" aria-label="Notifiche">
                <Bell className="h-4 w-4" />
              </Button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-[#E8EAF0] bg-white px-2 py-1.5 text-sm text-[#4A5068] hover:bg-[#F8F9FC]">
                <CircleUserRound className="h-5 w-5 text-[#3B6FE8]" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial="initial"
          animate="animate"
          variants={pageVariants}
          transition={pageTransition}
          className="min-h-[calc(100vh-64px)] px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
