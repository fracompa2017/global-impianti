"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Camera, Loader2, SendHorizontal, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FotoItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type ToastState = {
  type: "error" | "warning" | "success";
  message: string;
};

type ReportFormProps = {
  cantiereOggi: {
    id: string;
    nome: string;
    indirizzo: string | null;
  } | null;
  dipendenteNome: string;
};

const MAX_FOTO = 20;

const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

function isAcceptedFile(file: File) {
  if (ACCEPTED_MIME.has(file.type.toLowerCase())) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"].some((ext) =>
    lowerName.endsWith(ext)
  );
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ReportGiornalieroForm({ cantiereOggi, dipendenteNome }: ReportFormProps) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fotoRef = useRef<FotoItem[]>([]);

  const [descrizioneLavori, setDescrizioneLavori] = useState("");
  const [materialiUtilizzati, setMaterialiUtilizzati] = useState("");
  const [problemiRiscontrati, setProblemiRiscontrati] = useState("");
  const [aiPreview, setAiPreview] = useState("");

  const [foto, setFoto] = useState<FotoItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processingFoto, setProcessingFoto] = useState(false);
  const [submitting, setSubmitting] = useState<"idle" | "loading" | "success">("idle");
  const [warningNoFotoShown, setWarningNoFotoShown] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [shakeDescrizione, setShakeDescrizione] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lightboxFoto, setLightboxFoto] = useState<FotoItem | null>(null);

  const todayLabel = useMemo(() => {
    const raw = format(new Date(), "EEEE d MMMM yyyy", { locale: it });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  const showToast = (next: ToastState) => {
    setToast(next);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  useEffect(() => {
    fotoRef.current = foto;
  }, [foto]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      fotoRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    const incoming = Array.from(fileList);

    if (foto.length + incoming.length > MAX_FOTO) {
      showToast({
        type: "warning",
        message: `Puoi allegare massimo ${MAX_FOTO} foto per report`,
      });
      return;
    }

    const invalidFile = incoming.find((file) => !isAcceptedFile(file));
    if (invalidFile) {
      showToast({
        type: "error",
        message: "Formato non supportato. Usa JPG, PNG, HEIC o WEBP",
      });
      return;
    }

    setProcessingFoto(true);

    try {
      const compressedItems: FotoItem[] = [];

      for (const originalFile of incoming) {
        const compressedBlob = await imageCompression(originalFile, {
          maxWidthOrHeight: 1200,
          initialQuality: 0.8,
          useWebWorker: true,
        });

        const normalizedFile =
          compressedBlob instanceof File
            ? compressedBlob
            : new File([compressedBlob], originalFile.name, {
                type: compressedBlob.type || originalFile.type,
                lastModified: Date.now(),
              });

        compressedItems.push({
          id: uid(),
          file: normalizedFile,
          previewUrl: URL.createObjectURL(normalizedFile),
        });
      }

      setFoto((prev) => [...prev, ...compressedItems]);
      setWarningNoFotoShown(false);
    } catch {
      showToast({ type: "error", message: "Errore durante la compressione delle foto" });
    } finally {
      setProcessingFoto(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    }
  };

  const removeFoto = (id: string) => {
    setFoto((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const generateWithAI = async () => {
    if (!descrizioneLavori.trim()) {
      setShakeDescrizione(true);
      showToast({ type: "error", message: "Descrizione obbligatoria" });
      window.setTimeout(() => setShakeDescrizione(false), 350);
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch("/api/dipendente/report/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cantiere: cantiereOggi?.nome ?? "Cantiere non assegnato",
          data: format(new Date(), "yyyy-MM-dd"),
          dipendente: dipendenteNome,
          descrizione_lavori: descrizioneLavori,
          materiali_utilizzati: materialiUtilizzati || undefined,
          problemi_riscontrati: problemiRiscontrati || undefined,
          n_foto_allegate: foto.length,
        }),
      });

      const payload = (await response.json()) as { testo?: string; error?: string };

      if (!response.ok || !payload.testo) {
        throw new Error(payload.error ?? "Errore generazione AI");
      }

      setAiPreview(payload.testo);
      showToast({ type: "success", message: "Bozza AI generata" });
    } catch (error) {
      showToast({
        type: "error",
        message: error instanceof Error ? error.message : "Errore generazione AI",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!descrizioneLavori.trim()) {
      setShakeDescrizione(true);
      showToast({ type: "error", message: "Descrizione obbligatoria" });
      window.setTimeout(() => setShakeDescrizione(false), 350);
      return;
    }

    if (foto.length === 0 && !warningNoFotoShown) {
      setWarningNoFotoShown(true);
      showToast({
        type: "warning",
        message: "Allega almeno una foto prima di inviare",
      });
      return;
    }

    setSubmitting("loading");

    try {
      const body = new FormData();
      body.append("descrizione_lavori", descrizioneLavori);
      body.append("materiali_utilizzati", materialiUtilizzati);
      body.append("problemi_riscontrati", problemiRiscontrati);
      body.append("testo_generato_ai", aiPreview);
      body.append("data", format(new Date(), "yyyy-MM-dd"));

      if (cantiereOggi?.id) {
        body.append("cantiere_id", cantiereOggi.id);
      }

      foto.forEach((item) => {
        body.append("foto", item.file, item.file.name);
      });

      const response = await fetch("/api/dipendente/report", {
        method: "POST",
        body,
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Errore invio report");
      }

      setSubmitting("success");
      showToast({ type: "success", message: "Report inviato con successo" });
      window.setTimeout(() => {
        router.push("/dipendente/home");
      }, 2000);
    } catch (error) {
      setSubmitting("idle");
      showToast({
        type: "error",
        message: error instanceof Error ? error.message : "Errore invio report",
      });
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#0A0C14]">Report giornaliero</h1>
        <p className="text-sm text-[#4A5068]">{todayLabel}</p>
      </header>

      <section className="space-y-4 rounded-[20px] border-[1.5px] border-[#E8EAF0] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-[#4A5068]">Descrizione lavori svolti</label>
          <Textarea
            value={descrizioneLavori}
            onChange={(event) => setDescrizioneLavori(event.target.value)}
            className={cn(shakeDescrizione && "animate-[shake_0.35s_ease-in-out]")}
            placeholder="Descrivi attivita svolte, avanzamento e operazioni principali"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-[#4A5068]">Materiali utilizzati</label>
          <Textarea
            value={materialiUtilizzati}
            onChange={(event) => setMaterialiUtilizzati(event.target.value)}
            placeholder="Elenca materiali e quantita (opzionale)"
            className="min-h-[96px]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-[#4A5068]">Problemi riscontrati</label>
          <Textarea
            value={problemiRiscontrati}
            onChange={(event) => setProblemiRiscontrati(event.target.value)}
            placeholder="Anomalie, ritardi o criticita (opzionale)"
            className="min-h-[96px]"
          />
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            onClick={generateWithAI}
            disabled={aiLoading}
            className="w-full"
          >
            {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Genera con AI
          </Button>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-[#4A5068]">Preview report AI (editabile)</label>
            <Textarea
              value={aiPreview}
              onChange={(event) => setAiPreview(event.target.value)}
              placeholder="La bozza generata dall'AI comparira qui"
              className="min-h-[160px]"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-[20px] border-[1.5px] border-[#E8EAF0] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.02em] text-[#0A0C14]">Foto del cantiere</h2>
          <p className="text-sm text-[#4A5068]">Allega le foto della giornata di lavoro</p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
            dragOver
              ? "border-[#3B6FE8] bg-[#EEF3FF]"
              : "border-[#E8EAF0] bg-[#F8F9FC] hover:border-[#3B6FE8] hover:bg-[#EEF3FF]"
          )}
        >
          <Camera className="mx-auto h-8 w-8 text-[#9199B1]" />
          <p className="mt-2 text-sm font-semibold text-[#0A0C14]">Trascina le foto qui</p>
          <p className="text-xs text-[#9199B1]">oppure</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={processingFoto}
            >
              📷 Scatta foto
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={processingFoto}
            >
              🖼️ Scegli galleria
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>

        <p className="text-sm font-semibold text-[#4A5068]">{foto.length} foto allegate</p>

        {processingFoto ? (
          <p className="text-sm text-[#9199B1]">Compressione foto in corso...</p>
        ) : null}

        {foto.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {foto.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <button
                  type="button"
                  className="h-full w-full"
                  onClick={() => setLightboxFoto(item)}
                >
                  <img src={item.previewUrl} alt="Anteprima" className="h-full w-full object-cover" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFoto(item.id);
                  }}
                  className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Rimuovi foto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8EAF0] bg-[rgba(255,255,255,0.9)] px-6 py-4 backdrop-blur-xl">
        <Button className="w-full" onClick={onSubmit} disabled={submitting === "loading" || submitting === "success"}>
          {submitting === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Invio in corso...
            </>
          ) : submitting === "success" ? (
            <span className="text-[#10B981]">✓ Report inviato!</span>
          ) : (
            <>
              Invia Report
              <SendHorizontal className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            className={cn(
              "fixed right-4 top-20 z-50 max-w-xs rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              toast.type === "error" && "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
              toast.type === "warning" && "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
              toast.type === "success" && "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]"
            )}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {lightboxFoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setLightboxFoto(null)}>
          <button
            type="button"
            onClick={() => setLightboxFoto(null)}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
            aria-label="Chiudi anteprima"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxFoto.previewUrl}
            alt="Anteprima fullscreen"
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
