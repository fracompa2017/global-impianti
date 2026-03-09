"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function PhotoUpload({
  reportId,
  onUploaded,
}: {
  reportId: string;
  onUploaded?: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const path = `report-foto/${reportId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("report-foto")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("report-foto").getPublicUrl(path);

      await supabase.from("report_foto").insert({
        report_id: reportId,
        url: publicUrl,
      });

      onUploaded?.(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore upload foto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Aggiungi foto (opzionale)</label>
      <input type="file" accept="image/*" onChange={onFileChange} className="block w-full text-sm" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" disabled={loading} variant="outline" size="sm">
        {loading ? "Upload in corso..." : "Pronto per upload"}
      </Button>
    </div>
  );
}
