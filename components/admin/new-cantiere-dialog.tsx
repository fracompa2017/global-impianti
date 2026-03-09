"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nome: z.string().min(2),
  cliente: z.string().optional(),
  indirizzo: z.string().optional(),
  descrizione: z.string().optional(),
  dataFinePrevista: z.string().optional(),
});

type FormInput = z.infer<typeof schema>;

export function NewCantiereDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormInput) => {
    setError(null);

    const response = await fetch("/api/team/create?resource=cantiere", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Errore creazione cantiere");
      return;
    }

    reset();
    setOpen(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuovo Cantiere</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo cantiere</DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome ? <p className="text-xs text-destructive">{errors.nome.message}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cliente">Cliente</Label>
            <Input id="cliente" {...register("cliente")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="indirizzo">Indirizzo</Label>
            <Input id="indirizzo" {...register("indirizzo")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dataFinePrevista">Data fine prevista</Label>
            <Input id="dataFinePrevista" type="date" {...register("dataFinePrevista")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="descrizione">Descrizione</Label>
            <Textarea id="descrizione" {...register("descrizione")} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creazione..." : "Crea cantiere"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
