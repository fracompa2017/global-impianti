"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";

export function AdminShellClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AdminShell pathname={pathname} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)}>
      {children}
    </AdminShell>
  );
}
