"use client";

import { ArrowDown, Share2 } from "lucide-react";

export function IOSInstructions({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden max-w-xs rounded-2xl border border-[#E8EAF0] bg-white p-4 shadow-[0_16px_38px_rgba(0,0,0,0.12)] md:block">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#3B6FE8]">
        <Share2 className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-[#0A0C14]">Installa su iPhone</p>
      <p className="mt-1 text-xs text-[#4A5068]">Tocca Condividi e poi "Aggiungi a Home".</p>
      <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#3B6FE8]">
        <ArrowDown className="h-4 w-4 animate-bounce" />
        Procedi dalla barra di Safari
      </div>
    </div>
  );
}
