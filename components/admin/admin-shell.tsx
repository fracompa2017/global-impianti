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
  Menu,
  Search,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
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
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  disabled?: boolean;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "PRINCIPALE",
    items: [
      { href: "/admin/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
      { href: "/admin/cantieri",   label: "Cantieri",     icon: Building2 },
      { href: "/admin/team",       label: "Team",         icon: Users },
    ],
  },
  {
    title: "OPERATIVO",
    items: [
      { href: "/admin/turni",             label: "Turni",         icon: CalendarDays,  disabled: true },
      { href: "/admin/presenze",          label: "Presenze",      icon: UserCheck },
      { href: "/admin/report-interventi", label: "Report",        icon: FileText,      disabled: true },
      { href: "/admin/segnalazioni",      label: "Segnalazioni",  icon: ShieldAlert,   disabled: true },
    ],
  },
  {
    title: "DOCUMENTI",
    items: [
      { href: "/admin/documenti",  label: "Documenti",    icon: FileText, disabled: true },
      { href: "/admin/preventivi", label: "Preventivi AI",icon: Wrench,   disabled: true },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings, disabled: true },
      { href: "/auth/logout",        label: "Logout",       icon: LogOut },
    ],
  },
];

function getBreadcrumb(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  if (!segments.length) return "Dashboard";
  return segments
    .map((s) => s.replace(/-/g, " "))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" / ");
}

function SidebarContent({
  pathname,
  collapsed,
  onToggle,
  onClose,
}: {
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col" style={{ background: "#FFFFFF" }}>
      {/* Logo */}
      <div
        className="border-b px-5 py-6"
        style={{ borderColor: "rgba(221,217,210,0.6)" }}
      >
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
            style={{
              background: "linear-gradient(135deg,#2B5CE6,#4A78F5)",
              boxShadow: "0 6px 18px rgba(43,92,230,0.35)",
            }}
          >
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-extrabold tracking-[-0.025em] text-[#0C1117]">
                Global Impianti
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "#EBF1FF", color: "#2B5CE6" }}
              >
                Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p
                className="px-4 pb-2 text-[10px] font-extrabold tracking-[0.1em]"
                style={{ color: "#94A3B8" }}
              >
                {section.title}
              </p>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = !item.disabled && pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.disabled ? pathname : item.href}
                    onClick={onClose}
                    className={cn(
                      "group relative mx-1 flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                      item.disabled
                        ? "cursor-not-allowed opacity-40 text-[#94A3B8]"
                        : active
                        ? "text-[#2B5CE6]"
                        : "text-[#475569] hover:text-[#0C1117]",
                      collapsed && "justify-center px-2"
                    )}
                    style={
                      active
                        ? { background: "linear-gradient(135deg,#EBF1FF,#E0EBFF)" }
                        : !item.disabled
                        ? undefined
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (!active && !item.disabled) {
                        (e.currentTarget as HTMLElement).style.background = "#F4F1EC";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "";
                      }
                    }}
                  >
                    {active && (
                      <span
                        className="absolute -left-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                        style={{ background: "linear-gradient(180deg,#2B5CE6,#4A78F5)" }}
                      />
                    )}
                    <Icon
                      className="h-4 w-4 shrink-0"
                      strokeWidth={active ? 2.4 : 1.8}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t p-3" style={{ borderColor: "rgba(221,217,210,0.6)" }}>
        {!collapsed && (
          <div
            className="mb-3 rounded-[16px] p-3 text-xs"
            style={{ background: "linear-gradient(135deg,#EBF1FF,#F0EBFF)", color: "#475569" }}
          >
            <p className="font-bold text-[#0C1117]">Global Impianti</p>
            <p className="mt-0.5">Piano Enterprise · v1.0</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex h-9 w-full items-center justify-center rounded-[12px] text-[#475569] transition-all hover:bg-[#F4F1EC] hover:text-[#0C1117]",
            collapsed ? "w-9 mx-auto" : ""
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ pathname, collapsed, onToggle, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app, #F2EFE9)" }}>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r transition-all duration-300 lg:flex lg:flex-col",
          collapsed ? "w-[76px]" : "w-[268px]"
        )}
        style={{ borderColor: "rgba(221,217,210,0.7)", boxShadow: "2px 0 20px rgba(12,26,58,0.06)" }}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} onToggle={onToggle} />
      </aside>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(12,26,58,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
              style={{ boxShadow: "8px 0 32px rgba(12,26,58,0.15)" }}
            >
              <SidebarContent
                pathname={pathname}
                collapsed={false}
                onToggle={() => {}}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[268px]")}>
        {/* Topbar */}
        <header
          className="sticky top-0 z-30"
          style={{
            background: "rgba(242,239,233,0.88)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: "1px solid rgba(195,189,180,0.5)",
            boxShadow: "0 1px 0 rgba(195,189,180,0.3), 0 4px 16px rgba(12,26,58,0.04)",
          }}
        >
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            {/* Hamburger (mobile) */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[12px] text-[#475569] transition-all hover:bg-[#EAE6DF] hover:text-[#0C1117] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Apri menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold tracking-[-0.01em] text-[#0C1117]">
                {getBreadcrumb(pathname)}
              </p>
            </div>

            {/* Search (desktop) */}
            <div className="hidden min-w-[260px] flex-1 lg:block">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="search"
                  placeholder="Cerca cantieri, dipendenti..."
                  className="h-10 w-full rounded-[12px] pl-10 pr-4 text-sm font-medium outline-none transition-all"
                  style={{
                    background: "#EAE6DF",
                    border: "0",
                    color: "#0C1117",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(43,92,230,0.15), 0 4px 16px rgba(12,26,58,0.09)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#EAE6DF";
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[12px] text-[#475569] transition-all hover:bg-[#EAE6DF] hover:text-[#0C1117]"
                aria-label="Notifiche"
              >
                <Bell className="h-4.5 w-4.5" />
              </button>
              <button
                className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-semibold text-[#475569] transition-all hover:bg-[#EAE6DF] hover:text-[#0C1117]"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(12,26,58,0.07)" }}
              >
                <CircleUserRound className="h-5 w-5 text-[#2B5CE6]" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
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
