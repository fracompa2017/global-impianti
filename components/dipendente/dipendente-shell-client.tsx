"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DipendenteShell } from "@/components/dipendente/dipendente-shell";

export function DipendenteShellClient({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  return (
    <DipendenteShell pathname={pathname} userName={userName}>
      {children}
    </DipendenteShell>
  );
}
