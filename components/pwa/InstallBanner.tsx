"use client";

import { Download, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";

type InstallBannerProps = {
  open: boolean;
  onInstall: () => Promise<boolean>;
};

export function InstallBanner({ open, onInstall }: InstallBannerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-xl rounded-[24px] border border-[rgba(232,234,240,0.8)] bg-[rgba(255,255,255,0.9)] p-5 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] text-white shadow-[0_8px_20px_rgba(59,111,232,0.35)]">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0A0C14]">Global Impianti</p>
            <p className="text-xs text-[#4A5068]">Aggiungi alla schermata Home</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button className="min-w-[180px] flex-1" onClick={onInstall}>
            <Download className="mr-2 h-4 w-4" />
            Installa App
          </Button>
          <button
            type="button"
            className="hidden text-xs font-medium text-[#6B7280] transition-colors hover:text-[#111827]"
          >
            Continua nel browser
          </button>
        </div>
      </div>
    </div>
  );
}
